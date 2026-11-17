import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createResolver } from './resolve.mjs';

const websiteRequire = createRequire(new URL('../../apps/website/package.json', import.meta.url));
const astroRequire = createRequire(websiteRequire.resolve('astro/package.json'));
const { parse: parseAstro } = astroRequire('@astrojs/compiler-rs');
const { parse: parseSvelte } = websiteRequire('svelte/compiler');

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  visit(value);
  for (const [key, child] of Object.entries(value)) {
    if (!['loc', 'css', 'comments'].includes(key)) walk(child, visit);
  }
}

function expressionName(node) {
  if (!node) return '';
  if (node.name) return node.name;
  if (node.type === 'MemberExpression' && !node.computed)
    return `${expressionName(node.object)}.${expressionName(node.property)}`;
  if (node.type === 'JSXMemberExpression')
    return `${expressionName(node.object)}.${expressionName(node.property)}`;
  return '';
}

function componentMetadata(file) {
  const app = file.split('/')[1];
  const stem = path.posix.basename(file).replace(/\.(astro|svelte)$/, '');
  const framework = path.posix.extname(file).slice(1);
  let kind = 'component';
  let route = null;
  let name = stem;
  if (file.includes('/pages/') || stem === '+page') {
    kind = 'page';
    const marker = '/pages/';
    let relative;
    if (app === 'website') relative = file.split(marker)[1].replace(/\.astro$/, '');
    else
      relative = file
        .split('/routes/')[1]
        .replace(/\+page\.svelte$/, '')
        .replace(/\([^/]+\)\//g, '');
    route = '/' + relative.replace(/(^|\/)index$/, '').replace(/\/$/, '');
    if (route === '/') name = 'Home';
    else name = route.split('/').filter(Boolean).join(' / ');
  } else if (file.includes('/layouts/') || stem.startsWith('+layout')) {
    kind = 'layout';
    if (stem.startsWith('+layout')) {
      name =
        'Layout ' +
        file
          .split('/routes/')[1]
          .replace(/\+layout.*$/, '')
          .replace(/\/$/, '');
      name = name.trim();
    }
  } else if (file.includes('/components/ui/') || file.includes('/primitives/')) kind = 'primitive';
  return { id: file, app, name, framework, kind, route };
}

export function analyze(root) {
  const { resolveFile, resolveExport } = createResolver(root);
  const nodes = [];
  function collect(directory) {
    for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) collect(file);
      else if (/\.(astro|svelte)$/.test(file)) nodes.push(componentMetadata(file));
    }
  }
  for (const app of ['website', 'admin']) collect(`apps/${app}/src`);
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const diagnostics = [];

  for (const node of nodes) {
    const source = readFileSync(path.join(root, node.id), 'utf8');
    let ast;
    if (node.framework === 'astro') {
      const parsed = parseAstro(source, { filename: node.id });
      if (parsed.diagnostics?.some((item) => item.severity === 1))
        throw new Error(`Astro parse failed: ${node.id}`);
      ast = parsed.ast;
    } else ast = parseSvelte(source, { modern: true, filename: node.id });

    const imports = new Map();
    const tags = [];
    const dynamicImports = [];
    node.modules = [];
    node.external = [];
    node.unresolved = [];
    node.children = [];
    node.parents = [];
    node.lines = source.split('\n').length;
    const lineAt = (offset) => source.slice(0, offset ?? 0).split('\n').length;

    walk(ast, (item) => {
      if (item.type === 'ImportDeclaration' && item.importKind !== 'type') {
        const specifier = item.source.value;
        const target = resolveFile(node.id, specifier);
        if (target && !/\.(svelte|astro)$/.test(target)) node.modules.push(target);
        for (const entry of item.specifiers) {
          if (entry.importKind === 'type') continue;
          let name = 'default';
          if (entry.type === 'ImportSpecifier') name = entry.imported.name ?? entry.imported.value;
          if (entry.type === 'ImportNamespaceSpecifier') name = '*';
          imports.set(entry.local.name, { target, name, specifier });
        }
      }
      if (item.type === 'ImportExpression' && typeof item.source.value === 'string') {
        dynamicImports.push({ specifier: item.source.value, line: lineAt(item.start) });
      }
      if (item.type === 'Component') tags.push({ name: item.name, line: lineAt(item.start) });
      if (item.type === 'JSXOpeningElement')
        tags.push({ name: expressionName(item.name), line: lineAt(item.start) });
      if (item.type === 'SvelteComponent')
        tags.push({ name: expressionName(item.expression), line: lineAt(item.start) });
      if (item.type === 'SvelteSelf') tags.push({ name: '__self', line: lineAt(item.start) });
    });

    function addEdge(target, kind, tag, line) {
      if (!byId.has(target)) return;
      const existing = node.children.find((edge) => edge.target === target && edge.kind === kind);
      if (existing) {
        existing.count += 1;
        return;
      }
      node.children.push({ target, kind, tag, line, count: 1 });
    }

    for (const tag of tags) {
      if (node.framework === 'astro' && tag.name === 'Fragment') continue;
      if (tag.name === '__self') {
        addEdge(node.id, 'component', 'svelte:self', tag.line);
        continue;
      }
      const [local, member] = tag.name.split('.');
      const imported = imports.get(local);
      if (!imported) {
        if (/^[A-Z]/.test(tag.name)) node.unresolved.push(tag.name);
        continue;
      }
      if (!imported.target) {
        node.external.push(`${tag.name} · ${imported.specifier}`);
        continue;
      }
      let name = imported.name;
      if (name === '*') name = member;
      const target = resolveExport(imported.target, name);
      if (target) addEdge(target, 'component', tag.name, tag.line);
      else node.unresolved.push(tag.name);
    }
    for (const entry of dynamicImports) {
      const target = resolveExport(resolveFile(node.id, entry.specifier));
      if (target) addEdge(target, 'dynamic', entry.specifier, entry.line);
    }
    // SvelteKit adds layouts through route ancestry, outside the component AST.
    // Reset layouts (+page@ / +layout@) are reported, rather than guessed.
    if (node.app === 'admin' && ['page', 'layout'].includes(node.kind)) {
      let directory = path.posix.dirname(node.id);
      if (node.kind === 'layout') directory = path.posix.dirname(directory);
      while (directory.startsWith('apps/admin/src/routes')) {
        const layout = `${directory}/+layout.svelte`;
        if (byId.has(layout) && layout !== node.id) {
          addEdge(layout, 'layout', 'SvelteKit', 1);
          break;
        }
        directory = path.posix.dirname(directory);
      }
    }
    node.modules = [...new Set(node.modules)].sort();
    node.external = [...new Set(node.external)].sort();
    node.unresolved = [...new Set(node.unresolved)].sort();
    if (node.unresolved.length) diagnostics.push({ file: node.id, tags: node.unresolved });
  }
  for (const node of nodes) {
    for (const edge of node.children)
      byId.get(edge.target).parents.push({ target: node.id, kind: edge.kind, line: edge.line });
  }
  // Reachability includes framework-inherited layouts and every conditional branch.
  const reachable = new Set();
  function mark(id) {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const edge of byId.get(id).children) mark(edge.target);
  }
  for (const node of nodes) if (node.kind === 'page') mark(node.id);
  for (const node of nodes) node.reachable = reachable.has(node.id);
  return { nodes, diagnostics };
}

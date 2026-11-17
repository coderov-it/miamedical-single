import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Resolve local aliases and barrel exports without pulling external UI packages
// into the graph. See docs/code/component-graph.md for extraction boundaries.
export function createResolver(root) {
  const modules = new Map();

  function resolveFile(from, specifier) {
    let candidate;
    const app = from.split('/')[1];
    if (specifier.startsWith('~/')) candidate = `apps/${app}/src/${specifier.slice(2)}`;
    else if (specifier.startsWith('$lib/')) candidate = `apps/${app}/src/lib/${specifier.slice(5)}`;
    else if (specifier.startsWith('.'))
      candidate = path.posix.join(path.posix.dirname(from), specifier);
    else return null;
    const candidates = [candidate];
    if (candidate.endsWith('.js')) candidates.push(candidate.slice(0, -3) + '.ts');
    for (const extension of ['.ts', '.js', '.svelte', '.astro', '/index.ts', '/index.js']) {
      candidates.push(candidate + extension);
    }
    return (
      candidates.find(
        (file) => existsSync(path.join(root, file)) && statSync(path.join(root, file)).isFile(),
      ) ?? null
    );
  }

  function readModule(file) {
    if (modules.has(file)) return modules.get(file);
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(root, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const imports = new Map();
    const exports = new Map();
    const stars = [];
    for (const statement of source.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        statement.importClause &&
        !statement.importClause.isTypeOnly
      ) {
        const clause = statement.importClause;
        const target = resolveFile(file, statement.moduleSpecifier.text);
        if (clause.name) imports.set(clause.name.text, { target, name: 'default' });
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const entry of bindings.elements) {
            if (!entry.isTypeOnly)
              imports.set(entry.name.text, {
                target,
                name: (entry.propertyName ?? entry.name).text,
              });
          }
        }
      }
      if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;
      let target;
      if (statement.moduleSpecifier) target = resolveFile(file, statement.moduleSpecifier.text);
      if (!statement.exportClause) {
        if (target) stars.push(target);
        continue;
      }
      if (!ts.isNamedExports(statement.exportClause)) continue;
      for (const entry of statement.exportClause.elements) {
        if (entry.isTypeOnly) continue;
        const name = (entry.propertyName ?? entry.name).text;
        if (statement.moduleSpecifier) exports.set(entry.name.text, { target, name });
        else exports.set(entry.name.text, imports.get(name));
      }
    }
    const result = { exports, stars };
    modules.set(file, result);
    return result;
  }

  function resolveExport(file, name = 'default', seen = new Set()) {
    if (!file) return null;
    if (/\.(astro|svelte)$/.test(file)) return file;
    const key = `${file}:${name}`;
    if (seen.has(key)) return null;
    seen.add(key);
    const module = readModule(file);
    const entry = module.exports.get(name);
    if (entry) return resolveExport(entry.target, entry.name, seen);
    for (const target of module.stars) {
      const result = resolveExport(target, name, seen);
      if (result) return result;
    }
    return null;
  }

  return { resolveFile, resolveExport };
}

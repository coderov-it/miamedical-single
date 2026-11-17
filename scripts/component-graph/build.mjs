import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { analyze } from './analyze.mjs';

// Generates an offline, self-contained explorer. Run: pnpm components:graph.
// Extraction rules and limitations: docs/code/component-graph.md.
const root = fileURLToPath(new URL('../../', import.meta.url));
const assets = path.join(root, 'docs/assets/component-graph');
const graph = analyze(root);
graph.generatedAt = new Date().toISOString();
const read = (name) => readFileSync(path.join(assets, name), 'utf8');
const styles = ['styles.css', 'sidebar.css', 'canvas.css', 'inspector.css', 'responsive.css']
  .map(read)
  .join('\n');
const data = JSON.stringify(graph).replaceAll('<', '\\u003c');
const html = read('index.html')
  .replace('/* STYLES */', () => styles)
  .replace('/* DATA */', () => data)
  .replace('/* GRAPH */', () => read('graph.js'))
  .replace('/* EXPLORER */', () => read('explorer.js'));
const output = path.join(root, 'docs/generated/component-graph.html');
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, html);
console.log(
  `${graph.nodes.length} UI files, ${graph.nodes.reduce((sum, node) => sum + node.children.length, 0)} relationships`,
);
console.log(output);
if (graph.diagnostics.length)
  console.log(
    `${graph.diagnostics.length} files contain dynamic or unresolved tags; listed in the inspector.`,
  );

/**
 * The document around the catalogue: head, floating chrome, every page stacked
 * in one file, the stylesheet and the script.
 *
 * All of it in a single self-contained file — no fonts, no CDN, no build step,
 * no server. It is written INTO the assets root so every `src` is a plain
 * relative path, which is what lets it be opened with `file://` and still show
 * every photo. That is also why routing is hash-based: a `file://` page has no
 * history API worth using and no fetch to make.
 */
import type { CategoryEntry } from './category.ts';
import { CLIENT } from './client.ts';
import { escape } from './html.ts';
import { renderLanguageToggle, renderRail } from './nav.ts';
import { STYLE } from './style.ts';

export interface PageInput {
  entries: readonly CategoryEntry[];
  problems: readonly string[];
  /** Every `[data-page]` article, already rendered. */
  pages: string;
  assetsRoot: string;
  generatedAt: Date;
}

/**
 * Open when the list is short enough to read at a glance, collapsed when it is
 * not. Fifty missing files rendered in full push every product page below the
 * fold, which turns the warning into an obstacle; the count in the summary
 * still says it loudly.
 */
function problemBanner(problems: readonly string[]): string {
  if (problems.length === 0) return '';
  return `<div class="problems"><details class="problems-inner"${problems.length <= 6 ? ' open' : ''}>
    <summary>${problems.length.toString()} missing file(s)</summary>
    <ul>${problems.map((problem) => `<li>${escape(problem)}</li>`).join('')}</ul>
  </details></div>`;
}

export function renderPage(input: PageInput): string {
  const products = input.entries.reduce((total, entry) => total + entry.products.length, 0);
  const generated = `${input.entries.length.toString()} categories · ${products.toString()} products · assets from ${input.assetsRoot} · generated ${input.generatedAt.toISOString()}`;

  return `<!doctype html>
<html lang="it" data-lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Catalogue preview</title>
<meta name="generator" content="${escape(generated)}">
<style>${STYLE}</style>
</head>
<body>
${renderRail(input.entries)}
${renderLanguageToggle()}
${problemBanner(input.problems)}
${input.pages}
<script>${CLIENT}</script>
</body>
</html>
`;
}

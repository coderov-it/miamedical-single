# Component explorer

Run `pnpm components:graph`, then open `docs/generated/component-graph.html` in a
browser. The generated file is self-contained and works offline. Regenerate it
after source changes; its timestamp is stored in the embedded data. Output is ignored
by Git. Source templates live in `docs/assets/component-graph/`; the builder and
extractor live in `scripts/component-graph/`.

The graph fills the screen and expands from top to bottom. Both floating panels
start hidden; “Pages” and “Details” toggle them. Select a page, then click a node
to expand or collapse its direct dependencies. “Expand one level” opens the
next visible layer. Search spans every component
in the selected app, including files not reachable from a page. The inspector
shows children, direct consumers, local modules, external components and tags
that could not be resolved. Its links can make any component the graph root.
The URL fragment preserves the selected root. Zoom, fit and background dragging
support larger trees; dragging works at every zoom level, even without overflow.
The mouse wheel pans, Ctrl/Command + wheel zooms, and arrow keys move the focused
canvas. Native buttons support keyboard navigation. The interface uses installed
coding fonts (Cascadia Code, JetBrains Mono, SFMono, Consolas or Liberation Mono),
falling back to the system monospace font without network requests.

## Extraction boundaries

The extractor reads every `.astro` and `.svelte` file under the website and admin
source directories. It uses their installed compilers to parse component tags
and imports, and TypeScript to follow local barrel exports. It resolves relative
imports, `~/`, `$lib/`, `.js` references to TypeScript, named exports, renamed
exports and namespace component references. Literal dynamic component imports
are included with a separate edge type. Repeated references to a child collapse
into one edge and retain a count and the first reference's source line.

SvelteKit pages and layouts link to the nearest ancestor `+layout.svelte`.
These dashed edges indicate framework inheritance, not explicit markup.
The current source has no named layout resets; support must be added to the
extractor before using `+page@...` or `+layout@...` routes.

The map is a static file relationship graph, not a runtime DOM or render trace.
It includes conditional branches. Slots and snippets do not move dependencies
away from their declaring files. Computed dynamic components cannot always be
resolved; unresolved tags remain visible in the inspector. External package
internals, CSS, server handlers, module call graphs and generated framework files
are outside this UI component graph. “Not reached” is a static reachability result,
not proof that a file can be deleted.

Shared components appear once in each expanded branch; recursion stops at a
marked reference. The renderer limits the visible tree to 600 nodes and reports
that limit. Focus on a smaller root to inspect a dense subtree.

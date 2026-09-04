/**
 * The stylesheet, in one string.
 *
 * Canvas and surface: depth comes from lightness, never from a shadow. Cards
 * are the whitest thing on the page, the page sits a shade below them, recessed
 * elements (table headers, chips, inline code) a shade below that, and the
 * faintest neutral is spent only on hairlines. Take away the off-white page and
 * every card dissolves, because there is nothing else holding it up.
 *
 * One font stack, the platform's own UI face, and no webfont — hierarchy is
 * carried by size, weight and letter-spacing rather than by a second family.
 *
 * The language rule is scoped `body [data-lang]` rather than `[data-lang]`,
 * because `<html>` carries the same attribute and the unscoped selector hides
 * the entire document.
 */
export const STYLE = `
:root {
  --ink: #1b1b1b; --muted: #6f6f6f; --line: #e4e4e4; --surface: #f6f6f6;
  --page: #fbfbfb; --card: #ffffff; --accent: #0a5fb4; --tint: #e8f2ff;
  --bad: #b4231a; --bad-tint: #fff5f4; --warn: #96650a;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px; line-height: 1.5; }
h1, h2, h3, p, ol, ul { margin: 0; }
a { color: var(--accent); }
code { background: var(--surface); border-radius: 4px; padding: 1px 5px; font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.muted { color: var(--muted); }
.bad { color: var(--bad); font-weight: 600; }
.warn { color: var(--warn); }
[hidden] { display: none !important; }

/* --- two languages, one DOM --------------------------------------------- */
body [data-lang] { display: none; }
html[data-lang='it'] body [data-lang='it'],
html[data-lang='en'] body [data-lang='en'] { display: revert; }
.untranslated { border-bottom: 1px dotted var(--warn); }
.untranslated-note { color: var(--warn); font-size: 12px; margin-top: 8px; }

/* --- floating chrome ----------------------------------------------------- */
.chrome { position: fixed; top: 16px; z-index: 20; }
.chrome-left { left: 16px; }
.chrome-right { right: 16px; }
.rail, .lang { display: flex; align-items: stretch; gap: 1px; background: var(--line);
  border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.rail-select, .rail-button, .lang button {
  border: 0; background: var(--card); color: var(--ink); font: inherit; font-size: 13px;
  padding: 7px 12px; cursor: pointer; }
.rail-select { max-width: 300px; appearance: none; padding-right: 26px;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
                    linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 15px) 15px, calc(100% - 11px) 15px;
  background-size: 4px 4px, 4px 4px; background-repeat: no-repeat; }
.rail-button { width: 38px; display: grid; place-items: center; }
.bars, .bars::before, .bars::after { display: block; width: 14px; height: 1.5px;
  background: var(--ink); content: ''; }
.bars { position: relative; }
.bars::before { position: absolute; top: -5px; }
.bars::after { position: absolute; top: 5px; }
.rail-button[aria-expanded='true'] { background: var(--tint); }
.lang button.on { background: var(--tint); color: var(--accent); font-weight: 600; }

/* It floats over the page, so it costs nothing to make wide: at 440px most
   titles fit on one or two lines instead of three, which is the difference
   between scanning the list and reading it. */
.outline { margin-top: 8px; width: 440px; max-width: calc(100vw - 32px);
  max-height: calc(100vh - 80px); overflow-y: auto; background: var(--card);
  border: 1px solid var(--line); border-radius: 10px; padding: 10px; }
.outline-list { list-style: none; margin: 6px 0; padding: 0; counter-reset: item; }
.outline-list li { counter-increment: item; }
.outline-list a { display: grid; grid-template-columns: 24px 1fr; gap: 10px; padding: 7px 10px;
  border-radius: 6px; text-decoration: none; color: var(--ink); }
.outline-list a::before { content: counter(item); color: var(--muted); font-size: 11px;
  text-align: right; padding-top: 2px; }
.outline-list a:hover, .outline-overview:hover { background: var(--surface); }
.outline-list a.on { background: var(--tint); }
.outline-list a.on .outline-title { color: var(--accent); font-weight: 600; }
.outline-title { display: block; line-height: 1.35; }
.outline-meta { grid-column: 2; display: flex; gap: 6px; margin-top: 3px; }
.outline-overview { display: block; padding: 7px 10px; border-radius: 6px; font-size: 13px;
  text-decoration: none; color: var(--muted); }
.outline-overview.on { background: var(--tint); color: var(--accent); }

/* --- page ---------------------------------------------------------------- */
.page { max-width: 960px; margin: 0 auto; padding: 72px 24px 96px; }
.page-head { text-align: center; padding-bottom: 20px; }
.page-head h1 { font-size: 27px; line-height: 1.2; letter-spacing: -0.02em; margin: 8px 0 0; }
.eyebrow { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; align-items: center; }
.lede { max-width: 640px; margin: 12px auto 0; color: var(--muted); }
.chips { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
  margin: 14px 0 0; padding: 0; }
.chips li { background: var(--tint); color: var(--accent); border-radius: 20px;
  padding: 2px 12px; font-size: 13px; }

.flag { background: var(--surface); border-radius: 4px; padding: 1px 7px; font-size: 11.5px;
  color: var(--muted); white-space: nowrap; }
.flag.on, .flag.status-active, .flag.required { background: var(--tint); color: var(--accent); }
.flag.off, .flag.status-archived { background: var(--bad-tint); color: var(--bad); }
.badge { background: var(--ink); color: #fff; border-radius: 4px; padding: 2px 9px;
  font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; }

/* --- gallery ------------------------------------------------------------- */
.gallery { margin: 0 0 8px; }
.gallery.empty { text-align: center; padding: 24px 0; }
/* The tracks are spelled out because an implicit auto row takes its height from
   the image: a 1000x1000 photo made the row 1000px tall, so max-height: 100% on
   the img resolved against the photo itself, constrained nothing, and overflow
   left a cropped middle band. minmax(0, 1fr) is the viewer's own height, which
   is what that percentage has to resolve against. */
.viewer { height: 380px; background: var(--card); border: 1px solid var(--line);
  border-radius: 12px; display: grid; grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  place-items: center; overflow: hidden; padding: 12px; }
.viewer img, .viewer video { max-width: 100%; max-height: 100%; object-fit: contain; }
.viewer-doc { font-size: 13px; }
.viewer-missing { display: grid; gap: 6px; justify-items: center; color: var(--bad);
  font-size: 12px; border: 2px dashed var(--bad); background: var(--bad-tint);
  border-radius: 8px; padding: 24px 32px; word-break: break-all; text-align: center; }
.viewer-caption { display: flex; flex-direction: column; align-items: center; gap: 2px;
  margin-top: 8px; font-size: 11.5px; color: var(--muted); }
.caption-alt.none { color: var(--warn); }
.strip { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px; }
.strip.single { display: none; }
.thumb { width: 64px; padding: 0; border: 1px solid var(--line); border-radius: 8px;
  background: var(--card); cursor: pointer; overflow: hidden; display: grid; gap: 0; }
/* contain, never cover: a thumbnail that crops hides the shape of the photo,
   which is one of the things this page exists to show. */
.thumb img { width: 100%; height: 56px; object-fit: contain; display: block;
  background: var(--surface); }
.thumb-face { width: 100%; height: 56px; display: grid; place-items: center;
  background: var(--surface); font-size: 10px; color: var(--muted); }
.thumb-face.missing { background: var(--bad-tint); color: var(--bad); font-weight: 700; }
.thumb-role { font-size: 9.5px; color: var(--muted); padding: 2px 2px 3px; line-height: 1.1;
  word-break: break-all; }
.thumb.on { border-color: var(--accent); }
.thumb.on .thumb-role { color: var(--accent); }

/* --- panels -------------------------------------------------------------- */
.panel { background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  padding: 18px 20px; margin-top: 16px; }
.panel-head { display: flex; align-items: baseline; justify-content: center; gap: 10px;
  flex-wrap: wrap; padding-bottom: 12px; }
.panel-head h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--muted); font-weight: 600; }
.panel-note { font-size: 12px; color: var(--muted); }
.headline { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline;
  justify-content: center; padding-bottom: 4px; }
.headline-price { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
.headline-note { font-size: 12.5px; color: var(--muted); }

/* --- fields and prose ---------------------------------------------------- */
.fields { max-width: 720px; margin: 0 auto; }
.field { display: grid; grid-template-columns: 128px 1fr; gap: 12px; padding: 6px 0;
  border-top: 1px solid var(--line); }
.field:first-child { border-top: 0; }
.field-label { color: var(--muted); font-size: 11.5px; text-transform: uppercase;
  letter-spacing: 0.05em; padding-top: 2px; }
.field-value { text-align: left; }
.rich { max-width: 720px; margin: 12px auto 0; text-align: left;
  border-left: 3px solid var(--line); padding-left: 14px; }
.rich > :first-child { margin-top: 0; }
.rich > :last-child { margin-bottom: 0; }
.rich h2 { font-size: 15px; margin: 14px 0 6px; }
.rich p { margin: 8px 0; }
.rich ul, .rich ol { margin: 8px 0; padding-left: 20px; }
.help { display: block; color: var(--muted); font-size: 12px; margin-top: 3px; }
.options { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 4px; }
.option { font-size: 12.5px; }
.unit { color: var(--muted); font-size: 12px; }
.spec-icon { width: 18px; height: 18px; object-fit: contain; vertical-align: -4px; margin-right: 5px; }
.addon-icon { width: 28px; height: 28px; object-fit: contain; vertical-align: middle; margin-right: 8px; }

/* --- tables -------------------------------------------------------------- */
table { border-collapse: collapse; width: 100%; background: var(--card); margin-top: 10px; }
th, td { border: 1px solid var(--line); padding: 6px 9px; text-align: left; vertical-align: top; }
thead th, caption { background: var(--surface); font-size: 11.5px; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
caption { text-align: left; padding: 6px 9px; border: 1px solid var(--line); border-bottom: 0;
  border-radius: 8px 8px 0 0; }
td.num, td.value { text-align: right; white-space: nowrap; }
td.price { font-weight: 600; }
tfoot td { background: var(--surface); color: var(--muted); font-size: 12px; text-align: center; }
tr.unset td { color: var(--muted); }
tr.broken td { background: var(--bad-tint); }
.meta th[scope='row'] { width: 150px; background: var(--surface); font-weight: 500;
  color: var(--muted); font-size: 12px; }
.meta-grid { display: grid; gap: 16px; }

/* --- faqs ---------------------------------------------------------------- */
.faq { border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; margin-top: 8px; }
.faq summary { cursor: pointer; font-weight: 600; display: flex; gap: 8px; align-items: baseline; }
.faq .answer { margin-top: 8px; color: var(--muted); }

/* --- category page ------------------------------------------------------- */
.cat-icon { width: 84px; height: 84px; object-fit: contain; background: var(--surface);
  border-radius: 10px; display: block; margin: 12px auto 0; }
.cat-icon.empty, .cat-icon.absent { display: grid; place-items: center; gap: 3px;
  font-size: 10.5px; color: var(--muted); padding: 8px; text-align: center; }
.cat-icon.absent { border: 2px dashed var(--bad); color: var(--bad); background: var(--bad-tint); }

/* --- problems banner ----------------------------------------------------- */
.problems { max-width: 960px; margin: 0 auto; padding: 0 24px; }
.problems-inner { border: 1px solid var(--bad); border-radius: 10px; background: var(--bad-tint);
  padding: 14px 18px; }
.problems-inner > summary { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--bad); text-align: center; cursor: pointer; font-weight: 600; }
.problems ul { padding-left: 20px; font-size: 12.5px; margin-top: 8px;
  max-height: 40vh; overflow-y: auto; }

@media (max-width: 900px) {
  .chrome { position: static; }
  .chrome-left, .chrome-right { display: flex; justify-content: center; padding: 12px 16px 0; }
  .outline { position: absolute; }
  .page { padding-top: 24px; }
}
`;

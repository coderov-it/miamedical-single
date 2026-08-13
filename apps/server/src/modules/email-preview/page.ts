import { escapeHtml, type EmailMessage } from '@mia/templates';

/**
 * The chrome around a previewed email: a list of every message on the left, the
 * rendered one on the right.
 *
 * This is the only page this server serves to a human, and it is deliberately plain.
 * It has no build step, no CSS framework and no dependency — it exists to make the
 * emails easy to look at, and anything more would be a second frontend to maintain.
 *
 * The email itself is loaded in an `<iframe>` rather than inlined. That is the whole
 * point: an inlined body would inherit this page's styles and show you something no
 * inbox will ever render. The frame fetches the same bytes SES sends.
 */

const STYLE = `
*{box-sizing:border-box}
body{margin:0;height:100vh;display:flex;font:14px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;background:#111827}
aside{width:260px;flex:none;overflow-y:auto;border-right:1px solid #1f2937;padding:16px}
aside h1{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:0 0 12px}
aside a{display:block;padding:8px 10px;margin-bottom:2px;border-radius:6px;color:#d1d5db;text-decoration:none;font-size:13px;word-break:break-all}
aside a:hover{background:#1f2937}
aside a[aria-current]{background:#1d4ed8;color:#fff}
main{flex:1;min-width:0;display:flex;flex-direction:column}
header{padding:14px 20px;border-bottom:1px solid #1f2937;display:flex;flex-wrap:wrap;gap:4px 16px;align-items:baseline}
header b{font-size:15px}
header span{color:#9ca3af;font-size:12px}
nav{padding:10px 20px;border-bottom:1px solid #1f2937;display:flex;gap:8px;align-items:center}
button,nav a{background:#1f2937;color:#d1d5db;border:0;border-radius:6px;padding:6px 12px;font:inherit;font-size:12px;cursor:pointer;text-decoration:none}
button[aria-pressed=true]{background:#1d4ed8;color:#fff}
nav a{margin-left:auto}
.stage{flex:1;overflow:auto;background:#374151;padding:20px;display:flex;justify-content:center;align-items:flex-start}
iframe{width:600px;max-width:100%;height:100%;min-height:640px;border:0;background:#fff;border-radius:6px}
details{border-top:1px solid #1f2937;padding:12px 20px;background:#0b1220}
summary{cursor:pointer;color:#9ca3af;font-size:12px}
pre{margin:12px 0 0;padding:14px;background:#111827;border-radius:6px;overflow-x:auto;font-size:12px;color:#d1d5db}
`;

/*
  Widths a real reader has: a phone, the 600px every email framework targets, and the
  560px this design actually uses. Switching is a style change on the frame, so the
  message is never re-fetched and never re-rendered.
*/
const WIDTHS = [
  { label: 'Phone 375', value: '375px' },
  { label: 'Email 600', value: '600px' },
  { label: 'Full', value: '100%' },
];

const SCRIPT = `
const frame = document.getElementById('frame');
for (const button of document.querySelectorAll('[data-width]')) {
  button.addEventListener('click', () => {
    frame.style.width = button.dataset.width;
    for (const other of document.querySelectorAll('[data-width]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
  });
}
`;

export function previewPage(input: {
  names: string[];
  active: string;
  message: EmailMessage;
  basePath: string;
}): string {
  const { names, active, message, basePath } = input;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(active)} — email preview</title>
<style>${STYLE}</style>
</head>
<body>
<aside>
<h1>Email templates</h1>
${names
  .map(
    (name) =>
      `<a href="${basePath}/${encodeURIComponent(name)}"${name === active ? ' aria-current="page"' : ''}>${escapeHtml(name)}</a>`,
  )
  .join('\n')}
</aside>
<main>
<header>
<b>${escapeHtml(message.subject)}</b>
<span>to: ${escapeHtml(message.to.join(', '))}</span>
<span>${message.html.length} chars HTML · ${message.text.length} chars text</span>
</header>
<nav>
${WIDTHS.map(
  (width) =>
    `<button type="button" data-width="${width.value}" aria-pressed="${width.value === '600px'}">${width.label}</button>`,
).join('\n')}
<a href="${basePath}/${encodeURIComponent(active)}/html" target="_blank" rel="noreferrer">Open raw HTML</a>
</nav>
<div class="stage">
<iframe id="frame" src="${basePath}/${encodeURIComponent(active)}/html" title="${escapeHtml(active)}"></iframe>
</div>
<details>
<summary>Plain-text body — what the console transport prints and a text-only client shows</summary>
<pre>${escapeHtml(message.text)}</pre>
</details>
</main>
<script>${SCRIPT}</script>
</body>
</html>`;
}

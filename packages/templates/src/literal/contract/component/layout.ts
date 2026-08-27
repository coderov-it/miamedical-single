import { BRAND, COLORS } from '../../../brand.ts';
import { CONTACT } from '../../../contact.ts';
import { escapeHtml } from './escape.ts';

const FONT = "'Instrument Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export function contractLayout(props: { title: string; lang: 'it' | 'en'; body: string }): string {
  return `<!doctype html>
<html lang="${props.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(props.title)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${FONT};
    font-size: 13px;
    line-height: 1.5;
    color: ${COLORS.ink};
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .contract { max-width: 800px; margin: 0 auto; padding: 32px 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${COLORS.ink}; margin-bottom: 24px; }
  .brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .brand-tagline { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.inkFaint}; margin-top: 4px; }
  .contract-ref { text-align: right; font-size: 12px; color: ${COLORS.inkSoft}; }
  .contract-ref strong { display: block; font-size: 14px; color: ${COLORS.ink}; }
  h2 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .info-block label { display: block; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLORS.inkFaint}; margin-bottom: 2px; }
  .info-block span { font-size: 13px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.items th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: ${COLORS.inkSoft}; padding: 8px 10px; border-bottom: 1px solid ${COLORS.hair}; }
  table.items td { padding: 8px 10px; border-bottom: 1px solid ${COLORS.hair}; font-size: 13px; }
  table.items td.num { text-align: right; font-variant-numeric: tabular-nums; }
  table.items tfoot td { font-weight: 600; border-bottom: none; border-top: 2px solid ${COLORS.ink}; }
  .article { margin-bottom: 14px; }
  .article-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .article-body { font-size: 12px; line-height: 1.6; color: ${COLORS.inkSoft}; }
  .damage-list { margin: 12px 0; }
  .damage-list table { width: 100%; border-collapse: collapse; }
  .damage-list th, .damage-list td { padding: 4px 10px; font-size: 12px; border-bottom: 1px solid ${COLORS.hair}; }
  .damage-list th { text-align: left; font-weight: 600; }
  .damage-list td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .deposit-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 12px; }
  .deposit-box strong { display: block; margin-bottom: 4px; }
  .warning-box { background: #fdf1f0; border: 1px solid #d9534a; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 12px; font-weight: 600; color: #8f2b24; }
  .intro-line { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 12px; }
  .clause-critical { color: #b3312a; }
  .article-body p { margin-bottom: 6px; }
  .article-body p:last-child { margin-bottom: 0; }
  .article-body ul { margin: 6px 0 8px 18px; }
  .article-body li { margin-bottom: 4px; }
  .bank-details { margin-bottom: 20px; }
  .signature-block { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .signature-area { border-top: 1px solid ${COLORS.ink}; padding-top: 8px; }
  .signature-area p { font-size: 11px; color: ${COLORS.inkSoft}; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid ${COLORS.hair}; font-size: 10px; color: ${COLORS.inkFaint}; text-align: center; }
  @media print {
    .contract { padding: 0; }
    body { font-size: 11px; }
  }
</style>
</head>
<body>
<div class="contract">
${props.body}
<div class="footer">${BRAND.name} &middot; ${BRAND.tagline} &middot; Tel. ${CONTACT.phoneDisplay} &middot; ${BRAND.domain}</div>
</div>
</body>
</html>`;
}

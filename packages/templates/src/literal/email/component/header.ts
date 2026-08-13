import { BRAND, COLORS } from '../../../brand.ts';
import type { Audience } from './audience.ts';
import { escapeHtml } from './escape.ts';

const FONT = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

/**
 * Everything above a message's own copy: the document, the card, the brand lockup, and
 * the message's heading.
 *
 * It opens tags that `footer()` closes. The pair is deliberately split rather than being
 * one function taking the body, so a message reads top to bottom as the markup it
 * actually produces — `${header(...)}` first, copy in the middle, `${footer(...)}` last.
 *
 * ## Why the card is responsive AND has an Outlook ghost table
 *
 * The card was `width="560"` and that was wrong: a fixed 560px on a 375px phone
 * overflows, which is a horizontal scrollbar in a browser and a zoomed-out, unreadably
 * small message in a phone client. So the card is now `width="100%"` with
 * `max-width:560px`, which fits any screen and stops growing on a desktop.
 *
 * Outlook, though, renders mail through Word, which ignores `max-width` outright — on
 * its own that change would let the message run full-bleed and ragged across a maximised
 * Outlook window. The `<!--[if mso]>` table around the card is the fix: only Outlook
 * parses it, and it pins the width to 560 for exactly the client that cannot honour the
 * CSS. Every other client ignores the comment entirely.
 *
 * `x-apple-disable-message-reformatting` stops iOS Mail re-flowing the widths it just
 * read, and `color-scheme: light only` stops a dark-mode client inverting the palette
 * into something the contrast was never checked against.
 *
 * The brand sits in its own table row above a hairline rather than inside the copy cell,
 * so its padding cannot drift with the body's and every message opens identically. Why
 * it is type and not the logo file: see `brand.ts`.
 */
export function header(props: { heading: string; audience: Audience }): string {
  /* The copy is Italian for customers and English for the operations team. */
  const lang = props.audience === 'customer' ? 'it' : 'en';

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(props.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};-webkit-text-size-adjust:100%">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.page}">
<tr><td align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:560px;background:${COLORS.card};border-radius:8px">
<tr><td style="font-family:${FONT};padding:22px 24px 16px;border-bottom:1px solid ${COLORS.hair}">
<div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:${COLORS.ink}">${BRAND.name}</div>
<div style="font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.inkFaint};padding-top:5px">${BRAND.tagline}</div>
</td></tr>
<tr><td style="font-family:${FONT};font-size:15px;line-height:1.55;color:${COLORS.ink};padding:26px 24px">
<h1 style="font-size:20px;font-weight:600;line-height:1.3;margin:0 0 18px;color:${COLORS.ink}">${escapeHtml(props.heading)}</h1>`;
}

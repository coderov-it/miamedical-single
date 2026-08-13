/**
 * Who the message is from, as text.
 *
 * Deliberately not an image. `apps/website/public/img/logo.svg` is the real mark, but
 * SVG is unsupported in Gmail, Outlook and Apple Mail — it is stripped, leaving a gap —
 * and even a PNG is blocked by default in Outlook desktop until the reader clicks
 * "download pictures". A transactional email has to be recognisable in the half second
 * before that, so the wordmark is set in type: it always renders, costs no request, and
 * survives a dark-mode inversion.
 *
 * `name` matches the logo's own reading of the name, dots included, so the email and
 * the site do not appear to come from two different companies.
 */
export const BRAND = {
  name: 'M.i.a. Medical Italia',
  tagline: 'moving in autonomy',
  domain: 'miamedicalitalia.com',
} as const;

/**
 * The palette, as hex.
 *
 * ⚠️ Mirrors the tokens in `apps/website/src/styles/app.css` — `page` is
 * `--color-tint`, `ink` is `--color-ink`, `hair` is `--color-hair`, and so on. It has to
 * be written out rather than referenced because email clients strip `<style>` blocks and
 * do not resolve CSS custom properties: every colour in a message is an inline literal
 * or it is nothing. Change a token on the site and change it here.
 *
 * `button` is the one deliberate divergence. The storefront's primary CTA is
 * `--color-accent` (#3846b1); in email it is black, which is what makes the single
 * action unmistakable in a message with no other colour in it.
 */
export const COLORS = {
  page: '#f5f6f7',
  card: '#ffffff',
  ink: '#303137',
  inkSoft: '#525358',
  inkFaint: '#929397',
  hair: '#e7e8ea',
  button: '#000000',
  buttonText: '#ffffff',
} as const;

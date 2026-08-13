/**
 * `MAIL_FROM_ADDRESS` is written the way a mail client displays it —
 * `MiaMedical <no-reply@miamedicalitalia.com>`. SES takes that whole string as
 * its `FromEmailAddress`; Plunk wants the display name and the address as two
 * separate fields. Splitting it here keeps one sender identity in the
 * environment instead of asking for the same thing twice under two names.
 */

export interface FromAddress {
  email: string;
  /** Absent when the environment gave a bare address with no display name. */
  name?: string;
}

/** `Name <local@domain>`, with the name optionally quoted. */
const DISPLAY_FORM = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/;

export function parseFromAddress(value: string): FromAddress {
  const match = DISPLAY_FORM.exec(value);
  if (!match) return { email: value.trim() };

  const [, rawName = '', email = ''] = match;
  // `"M.i.a. Medical" <…>` is legal and common, because a display name holding a
  // dot or a comma has to be quoted. The quotes are syntax, not part of the name.
  const name = rawName.replace(/^"(.*)"$/, '$1').trim();

  return name ? { email, name } : { email };
}

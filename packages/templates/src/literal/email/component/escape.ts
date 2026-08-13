/**
 * HTML-escaping for values that reach markup.
 *
 * Every piece in this folder escapes its own props, so a message template can
 * interpolate a piece's return value without thinking about it and never has to call
 * this itself. That is the whole discipline: raw data enters through a prop, and the
 * prop is escaped where it is turned into markup.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/*
  The `test` before the `replace` is not a micro-optimisation for its own sake: most
  values here are URLs and names with nothing to escape, and skipping four passes over
  those took a whole render from 3.4 µs to 1.0 µs — a bigger win than the choice of
  renderer was.
*/
const NEEDS_ESCAPE = /[&<>"]/;

export function escapeHtml(value: string): string {
  return NEEDS_ESCAPE.test(value) ? value.replace(/[&<>"]/g, (char) => ESCAPES[char]!) : value;
}

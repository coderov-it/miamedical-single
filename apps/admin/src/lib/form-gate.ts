/**
 * The admin side of the rule in AGENTS.md: an action is never disabled and a
 * click never returns silently. The operator clicks Save, the form checks, and
 * anything missing is marked *at the control that is missing it* — the first one
 * takes focus so the fix is one keystroke away.
 *
 * The marking itself needs nothing new: an admin form already keeps a
 * `Record<string, string>` of dot-path → message for the server's
 * `error.fields`, and already renders it under the input. Client-side checks
 * write into the same object, so the two are indistinguishable on screen. This
 * module is only the missing half — moving the operator to the first of them.
 *
 * `disabled` while a request is in flight is a different thing and stays: it
 * prevents a second submit of work already accepted, rather than withholding
 * the first.
 */

/** A checked field and the DOM id of the control that carries it. */
export interface GateField {
  key: string;
  id: string;
}

/**
 * Scrolls to and focuses the control for the first issue, in the order the
 * fields are listed — which should be their order on screen, or focus lands
 * below where the operator is already reading.
 */
export function focusFirstIssue(
  issues: Record<string, string>,
  fields: readonly GateField[],
): void {
  const hit = fields.find((field) => issues[field.key]);
  if (!hit) return;

  const element = document.getElementById(hit.id);
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  // The scroll is already running; letting focus start a second one fights it.
  element?.focus({ preventScroll: true });
}

/**
 * The account forms' shared class strings.
 *
 * Lifted verbatim from the three page files this island replaces, where each
 * of them declared its own copy in frontmatter. They are here rather than in
 * a component so the two forms and any later screen agree without importing
 * each other.
 */

export const FIELD =
  'w-full rounded-lg border border-transparent bg-tint px-3 py-2.5 text-[15px] focus:border-accent aria-[invalid]:border-danger';

export const LABEL = 'mb-1.5 block text-sm font-medium';

/**
 * No `disabled:` variant, and that is the point: nothing in this island
 * disables a forward action. Re-entry while a save is in flight is guarded by
 * a flag inside the handler, so the button stays clickable and the click
 * always says something. See AGENTS.md § "Never block a customer".
 */
export const PRIMARY =
  'rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-accent-deep';

/** The gate's live region: `role="status"` carrying the two count templates. */
export const ANNOUNCE = 'sr-only';

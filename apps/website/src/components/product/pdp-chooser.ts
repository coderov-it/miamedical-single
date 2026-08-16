/**
 * The order panel asks the customer for two things — a package and a start
 * date — and per the owner's reference design they are one control repeated:
 * a small label ABOVE a filled single-line field, with the field's affordance
 * (a chevron, a calendar) at its right edge.
 *
 * The label is outside the field, not a kicker inside it, so the field holds
 * exactly one line: the answer. Anything derived from the answer — the return
 * date, the price — belongs to the overview below, not stacked in the box.
 *
 * The tokens live here rather than being typed into both components, because
 * the two sit one above the other and any drift between them is visible at a
 * glance. Each component appends only its own open state: the package
 * disclosure keys off `peer-checked`, the calendar off `aria-expanded`.
 */
export const PDP_LABEL = 'text-[13px] font-medium text-ink-2';

export const PDP_FIELD =
  'flex min-h-12 w-full items-center gap-2.5 rounded-[10px] border-[1.5px] border-transparent ' +
  'bg-tint px-3.5 text-left text-[14px] font-semibold hover:bg-tint-2';

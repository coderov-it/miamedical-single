/**
 * THE MARKUP CONTRACT for the form gate: how a template says "the customer has
 * to answer this", and how the browser reads that back.
 *
 * The whole point is that WHAT IS REQUIRED IS THE SERVER'S CALL. A variant group
 * is required because the back office said so, and only the page that rendered
 * the group knows — so the page declares the gate in the markup and the script
 * enforces whatever it finds. Nothing here has to be told about a new kind of
 * field, which is the same reason the add-to-cart handler reads `FormData`
 * rather than a list of names.
 *
 * One gated block looks like this:
 *
 *   <div data-gate="package" data-gate-focus="[data-pkg-trigger]">
 *     <input class="sr-only" type="checkbox" data-pkg-toggle data-gate-ignore />
 *     ...the radios...
 *     <p class="field-error" data-field-error="package" hidden>Scegli un pacchetto.</p>
 *   </div>
 *
 * The engine that acts on these lives in `form-validation.ts`; this module is
 * only the reading of them.
 */
import type { FieldGate } from './form-validation.ts';

/** Marks a block the customer has to answer. Its value is the gate's key. */
const GATE_ATTR = 'data-gate';

/**
 * A control inside a gated block that is not an ANSWER to it — the package
 * disclosure's open/closed checkbox is the case this exists for. Without it,
 * opening the list would satisfy the gate that asks you to pick from it.
 */
const IGNORE_ATTR = 'data-gate-ignore';

/** A selector, relative to the block, for what focus should land on instead. */
const FOCUS_ATTR = 'data-gate-focus';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * The controls that count as answers to this block.
 *
 * Two exclusions carry the weight. A control inside a NESTED gate belongs to
 * that gate — the start-time row lives inside the date block and is its own
 * question, so a filled date must not answer for a missing time. And a control
 * the page has disabled is not being asked at all; an unticked add-on's quantity
 * stepper is disabled precisely so it stops counting.
 */
function answersIn(block: HTMLElement): Control[] {
  const controls = block.querySelectorAll<Control>('input, select, textarea');
  const answers: Control[] = [];
  for (const control of controls) {
    if (control.disabled) continue;
    if (control.hasAttribute(IGNORE_ATTR)) continue;
    if (control.closest(`[${GATE_ATTR}]`) !== block) continue;
    answers.push(control);
  }
  return answers;
}

/**
 * Has this block been answered?
 *
 * A hidden block asks nothing — the start-time row only exists once an hourly
 * package is chosen, and a question nobody can see must never block the order.
 * Checkables decide it between themselves when there are any (one ticked box is
 * an answer for the whole group); otherwise any non-empty value will do.
 */
function isBlockAnswered(block: HTMLElement): boolean {
  if (block.hidden || block.closest('[hidden]')) return true;

  const answers = answersIn(block);
  if (answers.length === 0) return true;

  const checkables = answers.filter(
    (control): control is HTMLInputElement =>
      control instanceof HTMLInputElement &&
      (control.type === 'radio' || control.type === 'checkbox'),
  );
  if (checkables.length > 0) return checkables.some((control) => control.checked);

  return answers.some((control) => control.value.trim() !== '');
}

/**
 * Reads the gates out of the markup: every `[data-gate="<key>"]` block, paired
 * with the `[data-field-error="<key>"]` message inside it.
 *
 * WHAT IS REQUIRED IS THE SERVER'S CALL, not this script's. A variant group is
 * required because the back office said so, and the page that rendered the group
 * is the only thing that knows — so it declares the gate and the browser just
 * enforces whatever it finds. Nothing here has to be told about a new kind of
 * field, which is the same reason the add-to-cart handler reads `FormData`
 * rather than a list of names.
 *
 * `data-gate-focus` overrides where focus lands, and every `sr-only` control
 * needs it: a package radio is clipped to one pixel, so the gate points at the
 * visible field that opens the list instead. That element is ALSO flagged
 * `aria-invalid`, which is what puts the danger border somewhere the customer
 * can actually see it — a border on a one-pixel radio paints nothing.
 */
export function discoverGates(scope: ParentNode): FieldGate[] {
  return [...scope.querySelectorAll<HTMLElement>(`[${GATE_ATTR}]`)].map((block) => {
    const key = block.getAttribute(GATE_ATTR) ?? '';
    const focusSelector = block.getAttribute(FOCUS_ATTR);
    /* A proxy that is itself hidden is no better than the control it stands in
       for — the date block names the calendar trigger, which does not exist as a
       visible thing until the calendar mounts. Falling back to null puts the
       default scan back in charge, and that one already skips hidden subtrees. */
    const proxy = () => {
      if (!focusSelector) return null;
      const element = block.querySelector<HTMLElement>(focusSelector);
      return element && !element.closest('[hidden]') ? element : null;
    };
    return {
      key,
      isSatisfied: () => isBlockAnswered(block),
      controls: () => [...answersIn(block), proxy()],
      focus: proxy,
    };
  });
}

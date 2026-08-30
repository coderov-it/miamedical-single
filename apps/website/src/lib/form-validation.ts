/**
 * The storefront's form gate: what a customer still has to answer, said at the
 * control that needs answering.
 *
 * THE RULE THIS IMPLEMENTS (AGENTS.md): an action is never disabled and a click
 * never returns silently. The customer asks to move on, the page checks, and
 * anything missing is marked where it is missing — every unmet gate reveals its
 * message, the first one takes focus, and the count is announced. A disabled
 * submit and an `if (invalid) return` are the same bug wearing two hats: the
 * customer is stopped and never told why.
 *
 * NO ITALIAN LIVES HERE, and no message is built here either. Each message is a
 * `<p data-field-error="<key>" hidden>` the SERVER rendered inside the block it
 * belongs to; this module only reveals it, points `aria-describedby` at it and
 * flags the control `aria-invalid`. That is the same arrangement the rest of the
 * storefront uses (`data-cart-added`, the checkout's label island) and it exists
 * for the same reason: importing `~/lib/labels` would drag the whole catalog
 * into the browser bundle to get a handful of sentences.
 *
 * STRICT ON DEMAND, FORGIVING LIVE. `enforce()` reveals; `refresh()` only ever
 * hides. A customer who has been told about a missing package sees the message
 * disappear the instant they pick one, but nobody is scolded for a field they
 * have not reached yet.
 *
 * It is DOM-only and imports nothing, so it costs a page nothing but its own
 * bytes. Visual treatment lives on each server-rendered error via Tailwind.
 */

/** Marks the server-rendered message element inside a gated block. */
const MESSAGE_ATTR = 'data-field-error';

/** One thing the customer has to do before the page will let them move on. */
export interface FieldGate {
  /**
   * Matches the `data-field-error` of the message to reveal. Also the id stem
   * for `aria-describedby`, so it has to be unique within the scope.
   */
  key: string;
  /** True once the customer has done it. Called on every check — keep it cheap. */
  isSatisfied: () => boolean;
  /**
   * The controls that are wrong, flagged `aria-invalid` and pointed at the
   * message. Defaults to whatever `focus` returns.
   *
   * A function rather than a value because a gate's controls can be rebuilt
   * between checks — the calendar replaces its whole grid on every repaint.
   */
  controls?: () => Iterable<HTMLElement | null | undefined>;
  /**
   * What takes focus when this is the FIRST unmet gate. Defaults to the first
   * focusable control inside the message's block.
   *
   * Give this explicitly whenever the real control is `sr-only`: a package radio
   * cannot be focused or scrolled to, so the gate points at the visible field
   * that opens the list instead.
   */
  focus?: () => HTMLElement | null;
}

export interface FormGateOptions {
  /**
   * A `role="status"` element carrying `data-message-one` and
   * `data-message-many` templates with a `{count}` slot — the same shape the
   * product page's cart announcement uses. Spoken on every failed `enforce()`.
   *
   * Announcing the COUNT rather than a fixed sentence is deliberate: the text
   * changes whenever the number does, so a second failed attempt is announced
   * instead of passing silently as an unchanged live region.
   */
  announce?: HTMLElement | null;
}

export interface FormGate {
  /**
   * Reveals every unmet gate, focuses and scrolls to the first, announces the
   * count. Returns true when there was nothing to reveal.
   *
   * This is what a forward action calls — on click, always, never behind a
   * `disabled` check.
   */
  enforce: () => boolean;
  /**
   * Hides the message of every gate now satisfied. NEVER reveals one: a
   * customer part-way through typing has not failed anything yet.
   *
   * Wire it to the form's `input`/`change` so a corrected field clears itself
   * without waiting for another click.
   */
  refresh: () => void;
  /** Hides every message and clears every flag. */
  reset: () => void;
  /** The unmet gates, in declaration order. No DOM is touched. */
  unmet: () => FieldGate[];
}

function messageOf(scope: ParentNode, key: string): HTMLElement | null {
  return scope.querySelector<HTMLElement>(`[${MESSAGE_ATTR}="${cssEscape(key)}"]`);
}

/**
 * `CSS.escape` is not in every browser the storefront supports, and a gate key
 * is ours anyway — this only has to survive the characters we actually use.
 */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

/** The controls a gate flags, resolved and filtered. */
function controlsOf(gate: FieldGate, fallback: HTMLElement | null): HTMLElement[] {
  if (!gate.controls) return fallback ? [fallback] : [];
  const resolved: HTMLElement[] = [];
  for (const control of gate.controls()) if (control) resolved.push(control);
  return resolved;
}

/**
 * The block a message belongs to — the `[data-gate]` it sits inside.
 *
 * NOT `message.parentElement`, which is what this used to be and was wrong as
 * soon as a message was nested any deeper than a direct child. The delivery
 * questions wrap their hint and their message together in a `<FieldFoot>`, so
 * the parent was a two-element `<div>` containing no controls at all: the scan
 * below found nothing, the gate reported no focus target, and focus silently
 * skipped to the NEXT failing gate instead of the first one.
 */
function blockOf(message: HTMLElement): HTMLElement | null {
  return message.closest<HTMLElement>('[data-gate]') ?? message.parentElement;
}

/**
 * Where focus goes. An explicit `focus()` wins; otherwise the first focusable
 * control in the gate's block.
 *
 * `sr-only` CONTROLS ARE VALID TARGETS. They are clipped to a pixel, but they
 * are still focusable and — for every one of them on this site — the visible
 * thing beside them lights up on `peer-focus-visible`, so focus is not invisible
 * at all. What genuinely cannot be focused is a control inside a `display: none`
 * subtree, which is why the package field names its trigger through
 * `data-gate-focus`: its radios live in a popover that is closed until asked for.
 */
function focusTargetOf(gate: FieldGate, message: HTMLElement): HTMLElement | null {
  const explicit = gate.focus?.();
  if (explicit) return explicit;

  const block = blockOf(message);
  if (!block) return null;

  for (const candidate of block.querySelectorAll<HTMLElement>(
    'input, select, textarea, button, [tabindex]',
  )) {
    if (candidate.hasAttribute('disabled')) continue;
    if (candidate.closest('[hidden]')) continue;
    return candidate;
  }

  /* Nothing focusable in the block — a group of cards, say. Focus the block
     itself so the announcement has somewhere to land and the customer is at
     least looking at the right question. */
  return block;
}

/**
 * Focuses without fighting the browser.
 *
 * `preventScroll` then an explicit `scrollIntoView` rather than letting focus do
 * both: the default scroll lands the control flush against the viewport edge,
 * behind the sticky site header. `block: 'center'` puts it where it can be read.
 *
 * WHAT IS SCROLLED TO IS THE BLOCK, not the control. Half the controls here are
 * `sr-only` and one pixel tall; centring one of those puts the question, its
 * options and its new error message somewhere off screen. The customer needs to
 * see what they are being asked, not the input that records the answer.
 *
 * An element that is not natively focusable gets a `tabindex` of -1 so it still
 * receives focus — that is the case for a package field rendered as a `<label>`.
 */
function moveFocusTo(element: HTMLElement, scrollTo: HTMLElement): void {
  if (!element.hasAttribute('tabindex') && !isNativelyFocusable(element)) {
    element.setAttribute('tabindex', '-1');
  }
  element.focus({ preventScroll: true });
  scrollTo.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function isNativelyFocusable(element: HTMLElement): boolean {
  return /^(input|select|textarea|button|a)$/i.test(element.tagName);
}

/**
 * Adds the message to a control's `aria-describedby` without trampling a
 * description it already had — a field can carry both a hint and an error, and
 * the customer needs to hear both.
 */
function describe(control: HTMLElement, messageId: string): void {
  const current = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  if (!current.includes(messageId)) current.push(messageId);
  control.setAttribute('aria-describedby', current.join(' '));
}

function undescribe(control: HTMLElement, messageId: string): void {
  const remaining = (control.getAttribute('aria-describedby') ?? '')
    .split(/\s+/)
    .filter((id) => id && id !== messageId);
  if (remaining.length > 0) control.setAttribute('aria-describedby', remaining.join(' '));
  else control.removeAttribute('aria-describedby');
}

/**
 * Builds the gate for one form.
 *
 * `scope` is searched for the message elements, so it has to contain all of
 * them — on the product page that is the whole `<form>`, on the checkout the
 * step's own section.
 */
export function createFormGate(
  scope: ParentNode,
  gates: FieldGate[],
  options: FormGateOptions = {},
): FormGate {
  /** Whichever gates currently have their message showing. */
  const shown = new Set<string>();

  function hide(gate: FieldGate): void {
    const message = messageOf(scope, gate.key);
    if (!message) return;
    message.hidden = true;
    for (const control of controlsOf(gate, focusTargetOf(gate, message))) {
      control.removeAttribute('aria-invalid');
      if (message.id) undescribe(control, message.id);
    }
    shown.delete(gate.key);
  }

  function show(gate: FieldGate): { focus: HTMLElement; scrollTo: HTMLElement } | null {
    const message = messageOf(scope, gate.key);
    /* A gate with no message element is a template bug, not a runtime one. It
       must still block the customer from moving on — silently letting them past
       is the exact failure this module exists to stop — so the caller's `false`
       stands and only the explanation is missing. */
    if (!message) return null;

    if (!message.id) message.id = `field-error-${gate.key}`;
    message.hidden = false;

    const focusTarget = focusTargetOf(gate, message);
    for (const control of controlsOf(gate, focusTarget)) {
      control.setAttribute('aria-invalid', 'true');
      describe(control, message.id);
    }
    shown.add(gate.key);

    if (!focusTarget) return null;
    return { focus: focusTarget, scrollTo: blockOf(message) ?? focusTarget };
  }

  function announce(count: number): void {
    const region = options.announce;
    if (!region || count === 0) return;
    const template =
      count === 1 ? (region.dataset.messageOne ?? '') : (region.dataset.messageMany ?? '');
    region.textContent = template.replace('{count}', String(count));
  }

  const unmet = () => gates.filter((gate) => !gate.isSatisfied());

  return {
    unmet,

    enforce() {
      const failing = unmet();

      for (const gate of gates) {
        if (failing.includes(gate)) continue;
        if (shown.has(gate.key)) hide(gate);
      }

      let first: { focus: HTMLElement; scrollTo: HTMLElement } | null = null;
      for (const gate of failing) {
        const target = show(gate);
        if (!first && target) first = target;
      }

      if (failing.length === 0) {
        /* Nothing is wrong any more, so nothing should still be announced —
           otherwise the region keeps a stale count for the next reader. */
        if (options.announce) options.announce.textContent = '';
        return true;
      }

      if (first) moveFocusTo(first.focus, first.scrollTo);
      announce(failing.length);
      return false;
    },

    refresh() {
      /* Hide only. Revealing here would mark a field the customer is still
         typing into — see the note at the top. */
      for (const gate of gates) {
        if (shown.has(gate.key) && gate.isSatisfied()) hide(gate);
      }
      if (shown.size === 0 && options.announce) options.announce.textContent = '';
    },

    reset() {
      for (const gate of gates) hide(gate);
      if (options.announce) options.announce.textContent = '';
    },
  };
}

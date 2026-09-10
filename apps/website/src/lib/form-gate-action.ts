/**
 * `use:formGate` — the storefront's form gate, on a Svelte form.
 *
 * The gate itself is `lib/form-validation.ts`, which `AGENTS.md` names as THE
 * implementation of "never block a customer with a disabled control or a
 * silent return". A Svelte-native reimplementation would fork the rule and
 * drift from the checkout's and the product page's copies the first time
 * either is touched, so this is a seam rather than a port.
 *
 * ── THE GATE OWNS FIVE ATTRIBUTES ──────────────────────────────────────────
 * On everything inside this form: `hidden` and `id` on each
 * `[data-field-error]`, and `aria-invalid`, `aria-describedby` and `tabindex`
 * on the controls it flags. THE TEMPLATE MUST NOT WRITE ANY OF THEM — not as
 * an expression, not with a binding, not with `{#if}` around the message.
 *
 * This works because of one property of Svelte 5: it only re-asserts
 * attributes it renders *reactively*. A literal `hidden` in the markup is
 * written once at create time and never touched again, which leaves the gate
 * as the only writer. Give one of these attributes a reactive value and there
 * are two writers, the message flickers or never appears, and nothing type-
 * checks it. See `components/account/FieldError.svelte`.
 *
 * `bind:value` and `bind:this` are fine. Neither is one of the five.
 */
import { createFormGate, type FieldGate, type FormGate } from './form-validation.ts';

export interface FormGateParams {
  /**
   * Called once on mount. Each gate's own `isSatisfied` / `controls` / `focus`
   * are thunks the gate calls on every check, so closures over `$state` stay
   * live and a control an `{#if}` has remounted is re-resolved rather than
   * stale — write them as functions, never as captured values.
   */
  gates: () => FieldGate[];
  /** The `role="status"` element carrying `data-message-one`/`-many`. */
  announce?: () => HTMLElement | null;
  /** Hands the caller the gate, so its submit handler can `enforce()`. */
  ready: (gate: FormGate) => void;
}

export function formGate(node: HTMLFormElement, params: FormGateParams) {
  /* The gate owns validation from here on, so the browser must stop competing:
     two error UIs on one form is worse than either alone. Same line, and the
     same reason, as scripts/product/order-actions.ts. */
  node.noValidate = true;

  const gate = createFormGate(node, params.gates(), {
    announce: params.announce?.() ?? null,
  });

  /* Hide-only, per the gate's contract: a corrected field clears itself
     without waiting for another submit, and nobody is marked for a field they
     have not reached yet. */
  const refresh = () => gate.refresh();
  node.addEventListener('input', refresh);
  node.addEventListener('change', refresh);

  params.ready(gate);

  return {
    destroy() {
      node.removeEventListener('input', refresh);
      node.removeEventListener('change', refresh);
    },
  };
}

/**
 * The three-step accordion: which one is open, what the closed ones say about
 * themselves, and the identity chips that change what step 1 asks for.
 *
 * `data-state` on the `<section>` is the SINGLE switch — `todo`, `active`,
 * `done`. This module only ever writes that one attribute; what each state looks
 * like is CSS, in the checkout block of app.css. The reference design builds
 * those style strings in JavaScript instead, which would put the page's whole
 * visual state in a script that has to run before anything looks right.
 */
import type { CheckoutContext, StepIndex } from './context.ts';

export interface Stepper {
  goTo: (step: StepIndex) => void;
  /** Repaints the accordion from the current state, without moving. */
  paint: () => void;
  /** Repaints the chips and whichever fiscal block the chosen identity implies. */
  selectType: (id: string) => void;
}

export interface StepperOptions {
  /**
   * Runs before a forward move. Returning false cancels it — the gate has
   * already marked the fields and moved focus, so nothing else is needed here.
   */
  canLeave: (step: StepIndex) => boolean;
  /** Called when step 3 opens, so the review can be filled in. */
  onReview: () => void;
  /** Called after the identity changes, since it changes what step 1 requires. */
  onTypeChange: () => void;
}

export function createStepper(context: CheckoutContext, options: StepperOptions): Stepper {
  const { root, state, value, customerTypeLabel, deliveryName } = context;
  const sections = [...root.querySelectorAll<HTMLElement>('[data-step]')];

  /** The receipt a collapsed step shows for the answers it is hiding. */
  function summarise(index: StepIndex): string {
    if (index === 1) {
      return [
        `${value('firstName')} ${value('lastName')}`.trim(),
        value('email'),
        customerTypeLabel(state.type),
      ]
        .filter(Boolean)
        .join(' · ');
    }
    return deliveryName(state.delivery);
  }

  function paintSteps(): void {
    for (const section of sections) {
      const index = Number(section.dataset.step) as StepIndex;
      const done = state.done[index] === true && state.step !== index;
      section.dataset.state = done ? 'done' : state.step === index ? 'active' : 'todo';

      const body = section.querySelector<HTMLElement>('[data-step-body]');
      if (body) body.hidden = state.step !== index;

      const summary = section.querySelector<HTMLElement>('[data-step-summary]');
      if (summary) summary.textContent = index === 3 ? '' : summarise(index);
    }
  }

  function goTo(step: StepIndex): void {
    state.step = step;
    paintSteps();
    if (step === 3) options.onReview();
    sections
      .find((section) => Number(section.dataset.step) === step)
      ?.scrollIntoView({
        block: 'nearest',
      });
  }

  /*
   * Going BACK is never gated. "Modifica" on a completed step is how a customer
   * fixes what the gate just complained about, so refusing it while the form is
   * incomplete would lock them out of the only thing that could help.
   */
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-step-edit]')) {
    button.addEventListener('click', () => goTo(Number(button.dataset.stepEdit) as StepIndex));
  }

  /*
   * Going FORWARD always runs the gate. The button carries no disabled state of
   * any kind any more — see `gates.ts` for what that used to cost the customer.
   */
  for (const cta of root.querySelectorAll<HTMLButtonElement>('[data-step-continue]')) {
    cta.addEventListener('click', () => {
      const from = Number(cta.dataset.stepContinue) as StepIndex;
      if (!options.canLeave(from)) return;
      state.done[from] = true;
      goTo((from + 1) as StepIndex);
    });
  }

  /**
   * The identity chips. The two conditional fiscal blocks are server-rendered in
   * the state that matches the default chip, so the form is already correct
   * before this runs.
   */
  function selectType(id: string): void {
    state.type = id;
    for (const chip of context.typeChips) {
      const on = chip.dataset.customerType === id;
      chip.setAttribute('aria-checked', String(on));
      chip.setAttribute('aria-pressed', String(on));
    }
    for (const block of root.querySelectorAll<HTMLElement>('[data-when-type]')) {
      block.hidden = block.dataset.whenType !== id;
    }
    options.onTypeChange();
  }

  for (const chip of context.typeChips) {
    chip.addEventListener('click', () => selectType(chip.dataset.customerType ?? 'private'));
  }

  return { goTo, paint: paintSteps, selectType };
}

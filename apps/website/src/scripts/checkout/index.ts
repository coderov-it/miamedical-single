/**
 * The checkout's only module script, and the one place its pieces meet.
 *
 * It owns exactly one thing the server cannot: the customer's in-progress
 * answers. Everything visual is CSS keyed off `data-state` on a step and
 * `data-selected` on a card (see the checkout block in app.css), so these modules
 * write attributes and text, never style strings.
 *
 * WIRING:
 *
 *   input / change  ──→ gates.refresh()   a field just answered clears its message
 *                   └─→ summary.paintTotal(), stepper.paint()
 *   "Continua"      ──→ gates.enforce(step)   marks what is missing, or moves on
 *   step 3 opens    ──→ summary.paintReview()
 *
 * `refresh()` only ever HIDES a message; `enforce()` is the only thing that
 * reveals one. A customer part-way through typing has not failed anything yet.
 */
import { createContext } from './context.ts';
import { wireDelivery } from './delivery.ts';
import { createCheckoutGates } from './gates.ts';
import { wirePlaceOrder } from './place-order.ts';
import { createSummary } from './summary.ts';
import { createStepper } from './steps.ts';

const context = createContext();

if (context) {
  const gates = createCheckoutGates(context);
  const summary = createSummary(context);
  wirePlaceOrder(context);

  const stepper = createStepper(context, {
    canLeave: (step) => gates.enforce(step),
    onReview: summary.paintReview,
    /* The identity decides WHICH fiscal field is required, so changing it can
       make an outstanding message irrelevant — a company no longer needs the
       private codice fiscale it was just asked for. */
    onTypeChange: () => {
      gates.refresh();
      stepper.paint();
    },
  });

  wireDelivery(context, {
    onChange: () => {
      summary.paintTotal();
      gates.refresh();
      stepper.paint();
    },
  });

  /*
   * A `role="radio"` group has to answer to the arrow keys, or it announces
   * itself as a radio group and then behaves like a row of buttons. Native
   * radios would give this for free, but the reference design's options are whole
   * cards with panels inside them, which an <input> cannot be.
   */
  for (const group of context.root.querySelectorAll<HTMLElement>('[role="radiogroup"]')) {
    group.addEventListener('keydown', (event) => {
      const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
      if (!keys.includes(event.key)) return;
      const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      const current = radios.indexOf(event.target as HTMLElement);
      if (current === -1) return;
      event.preventDefault();
      const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const next = radios[(current + (forward ? 1 : -1) + radios.length) % radios.length];
      next?.focus();
      next?.click();
    });
  }

  const onEdit = () => {
    gates.refresh();
    stepper.paint();
  };
  context.root.addEventListener('input', onEdit);
  context.root.addEventListener('change', onEdit);

  stepper.selectType(context.state.type);
  stepper.paint();
  summary.paintTotal();
}

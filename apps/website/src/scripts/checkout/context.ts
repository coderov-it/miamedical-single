/**
 * Everything the checkout's modules share: the customer's in-progress answers,
 * the DOM they live in, and the words the server resolved for them.
 *
 * NOTHING IS IMPORTED FROM `~/lib` HERE, and that is deliberate. The delivery
 * names, the customer-type labels and the order's line items all ride on the DOM
 * as data attributes and JSON islands, because importing `~/lib/checkout` would
 * drag the whole typed Hono client into the browser bundle to get a handful of
 * strings. `~/lib/form-validation` is the one exception the gates make, and it
 * imports nothing itself.
 *
 * THE STATE IS THE FIVE ANSWERS THE DOM CANNOT HOLD. Everything else — which
 * step is open, which card is selected — is written back to attributes and read
 * from there, so the page's appearance is never a copy of a variable that could
 * fall out of step with it.
 */
import { documentLocale } from '../locale';

export type StepIndex = 1 | 2 | 3 | 4;

/** A control the customer types into. All of them carry `data-field`. */
export type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface CheckoutState {
  step: StepIndex;
  done: Record<number, boolean>;
  /** `private` | `company` | `tourist` — decides which fiscal field is asked. */
  type: string;
  /** A `DELIVERY_METHODS` id, or '' while nothing is chosen. */
  delivery: string;
  /** The chosen branch's city, when collecting. */
  pickup: string;
  /**
   * Where this page's one placement stands. Only `idle` may send; the others
   * are the lock — see `placement-lock.ts` for the whole state machine.
   */
  placement: PlacementPhase;
}

/**
 * `sending`   a POST is in flight, here or in another tab
 * `placed`    the order exists — final for this page
 * `uncertain` a POST may have reached the server and no answer came back
 */
export type PlacementPhase = 'idle' | 'sending' | 'placed' | 'uncertain';

export interface CheckoutContext {
  root: HTMLElement;
  /**
   * The contract step, or null when nothing is rented and there is nothing to
   * sign. Present, it is step 3 and confirmation moves to 4.
   */
  contractStep: StepIndex | null;
  /** The last step — the review and the "Invia" that places the order. */
  confirmStep: StepIndex;
  overview: HTMLElement;
  state: CheckoutState;
  /** A server-resolved word. Empty rather than `undefined` — see below. */
  label: (key: string) => string;
  /** The control with this `data-field`, or null. */
  field: (name: string) => Field | null;
  /** Its trimmed value, or ''. */
  value: (name: string) => string;
  deliveryCards: HTMLElement[];
  typeChips: HTMLButtonElement[];
  /**
   * The return leg's checkbox. NULL MEANS THIS ORDER HAS NO RETURN — nothing in
   * it is rented, so the whole block is absent and every use must be guarded.
   */
  returnSame: HTMLInputElement | null;
  returnSameLabel: HTMLElement | null;
  returnAddressField: HTMLElement | null;
  /** A delivery method's full name, for the review and the handover. */
  deliveryName: (id: string) => string;
  /** Its short name, for the totals column. */
  deliveryShort: (id: string) => string;
  customerTypeLabel: (id: string) => string;
  /** The server-computed items figure. The page adds nothing to it. */
  itemsTotal: number;
  money: Intl.NumberFormat;
  /** The order body's line items, priced and resolved on the server. */
  orderItems: unknown[];
  /** Each line's `lineKey()` in the browser cart, to clear once it is ordered. */
  cartKeys: string[];
  apiBase: string;
}

function parseIsland<T>(selector: string, fallback: T): T {
  const island = document.querySelector(selector);
  if (!island) return fallback;
  try {
    return JSON.parse(island.textContent || '') as T;
  } catch {
    return fallback;
  }
}

/**
 * Builds the context, or returns null when this is not a checkout with anything
 * in it — the empty state renders neither element and there is nothing to wire.
 */
export function createContext(): CheckoutContext | null {
  const root = document.querySelector<HTMLElement>('[data-checkout]');
  const overview = document.querySelector<HTMLElement>('[data-overview]');
  if (!root || !overview) return null;

  const deliveryCards = [...root.querySelectorAll<HTMLElement>('[data-delivery-card]')];
  const typeChips = [...root.querySelectorAll<HTMLButtonElement>('[data-customer-type]')];

  const names = new Map(
    deliveryCards.map((card) => [card.dataset.deliveryCard ?? '', card.dataset.deliveryName ?? '']),
  );
  const shortNames = new Map(
    deliveryCards.map((card) => [
      card.dataset.deliveryCard ?? '',
      card.dataset.deliveryShort ?? '',
    ]),
  );
  const typeLabels = new Map(
    typeChips.map((chip) => [chip.dataset.customerType ?? '', chip.textContent?.trim() ?? '']),
  );

  const labels = parseIsland<Record<string, string | undefined>>('[data-checkout-labels]', {});

  const field = (name: string) => root.querySelector<Field>(`[data-field="${name}"]`);

  const contractStep = root.querySelector('[data-contract-step]') ? 3 : null;

  return {
    root,
    contractStep,
    confirmStep: contractStep ? 4 : 3,
    overview,
    state: {
      step: 1,
      done: { 1: false, 2: false },
      type: 'private',
      delivery: '',
      pickup: '',
      placement: 'idle',
    },
    /* A missing key is a build-time bug, not a runtime one — but an empty string
       beats "undefined" turning up in a customer's WhatsApp message. */
    label: (key) => labels[key] ?? '',
    field,
    value: (name) => field(name)?.value.trim() ?? '',
    deliveryCards,
    typeChips,
    returnSame: root.querySelector<HTMLInputElement>('[data-field-return-same]'),
    returnSameLabel: root.querySelector<HTMLElement>('[data-return-same-label]'),
    returnAddressField: root.querySelector<HTMLElement>('[data-return-address-field]'),
    deliveryName: (id) => names.get(id) ?? '',
    deliveryShort: (id) => shortNames.get(id) ?? '',
    customerTypeLabel: (id) => typeLabels.get(id) ?? '',
    itemsTotal: Number(overview.dataset.itemsTotal ?? '0'),
    /* An open period used to matter here: it makes the big figure a per-unit rate
       and a delivery fee must not be folded into one. Nothing is added to it now,
       so the total is the items figure whichever kind it is, and the qualifier
       rendered underneath still says which. */
    money: new Intl.NumberFormat(documentLocale(), {
      style: 'currency',
      currency: overview.dataset.currency || 'EUR',
    }),
    orderItems: parseIsland<unknown[]>('[data-checkout-items]', []),
    cartKeys: parseIsland<string[]>('[data-checkout-cart-keys]', []),
    apiBase: root.dataset.apiBase ?? '',
  };
}

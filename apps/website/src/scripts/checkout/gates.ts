/**
 * What each step needs before the customer can move past it — and what the page
 * says when it is missing.
 *
 * THIS REPLACES A SILENT REFUSAL. The forward buttons used to be painted
 * `aria-disabled` whenever their step was incomplete, and their click handler
 * opened with `if (aria-disabled) return`. The customer clicked, nothing
 * happened, and no field was marked: they were left to work out for themselves
 * which of eleven controls was the problem. Now the buttons are always live, the
 * click always checks, and a failed check marks every offending field, scrolls to
 * the first and announces the count.
 *
 * THE GATES ARE WRITTEN OUT HERE RATHER THAN DISCOVERED FROM THE MARKUP, unlike
 * the product page's. Half of these are not "is it empty": an email has to look
 * like one, an address has a length floor that matches the API's own schema, the
 * fiscal field depends on which identity chip is lit, and the delivery method is
 * not a form control at all — it is a row of cards whose answer lives in
 * `state.delivery`. `discoverGates` cannot express any of that, and bending it
 * until it could would hide the rules rather than state them.
 *
 * The rules themselves are unchanged from the ones the reference design applies,
 * in the same order. What is new is that failing one is now audible.
 *
 * THE SERVER CAN FAIL A GATE TOO. A 422 from `POST /api/orders` names its fields
 * (`customer.email`, `delivery.address.line1`); `rejectFromServer()` maps each
 * onto the gate that owns that control and holds it failed until the answer
 * changes — so the server's verdict is marked exactly like the page's own, and
 * "Continua" cannot wave the same rejected value through again.
 */
import { isPlausibleEmail, isPlausiblePhone } from '@mia/validators/contact';

import { type FieldGate, type FormGate, createFormGate } from '~/lib/form-validation';
import type { CheckoutContext, StepIndex } from './context.ts';

/**
 * The length floor for the free-text address, matching `CheckoutAddressSchema`
 * on the server. Shorter than this is not an address, and catching it here means
 * the customer hears about it while they are still in the field.
 */
const MIN_ADDRESS_LENGTH = 6;

/** The return address's floor on the server (`CreateOrderSchema.returnAddress`). */
const MIN_RETURN_ADDRESS_LENGTH = 4;

/** A gate on a block the template already declared with `data-gate`. */
function fieldGate(
  context: CheckoutContext,
  key: string,
  isSatisfied: () => boolean,
  fieldName = key,
): FieldGate {
  return {
    key,
    isSatisfied,
    controls: () => [context.field(fieldName)],
  };
}

/**
 * Step 1 — who they are, and how to reach them. NOT where they are: that is
 * step 2's, and only when something is being delivered.
 *
 * The fiscal gates read the chip rather than the field's visibility, because
 * Italy asks a different identifier of each identity: a private customer has a
 * codice fiscale, a company has both a partita IVA and its own codice fiscale,
 * and a tourist has neither.
 */
function detailGates(context: CheckoutContext): FieldGate[] {
  const { value, state } = context;
  const isType = (id: string) => () => state.type !== id;

  return [
    fieldGate(context, 'firstName', () => value('firstName') !== ''),
    fieldGate(context, 'lastName', () => value('lastName') !== ''),
    /* The shapes the server's schemas accept, checked here so "@" or "abc" is
       said at the field on step 1 instead of failing the request on step 3.
       Never stricter than the server: an address that works must pass. */
    fieldGate(context, 'email', () => isPlausibleEmail(value('email'))),
    fieldGate(context, 'phone', () => isPlausiblePhone(value('phone'))),
    fieldGate(context, 'codiceFiscale', () => isType('private')() || value('codiceFiscale') !== ''),
    fieldGate(context, 'partitaIva', () => isType('company')() || value('partitaIva') !== ''),
    fieldGate(
      context,
      'companyCodiceFiscale',
      () => isType('company')() || value('companyCodiceFiscale') !== '',
    ),
  ];
}

/**
 * Step 2 — how it gets there, and where it comes back from.
 *
 * The address and the branch are each required by ONE method only. A customer
 * who typed an address and then switched to collection has not failed anything;
 * the field they filled is simply no longer being asked about.
 */
function deliveryGates(context: CheckoutContext): FieldGate[] {
  const { value, state, returnSame, root } = context;

  return [
    {
      key: 'deliveryMethod',
      isSatisfied: () => state.delivery !== '',
      /* The cards are not form controls, so there is nothing to mark
         `aria-invalid`; the message under the group is the whole feedback, and
         focus goes to the first card's radio button. */
      focus: () => root.querySelector<HTMLElement>('[data-delivery-select]'),
      controls: () => [],
    },
    fieldGate(
      context,
      'address',
      () => state.delivery !== 'homeDelivery' || value('address').length >= MIN_ADDRESS_LENGTH,
    ),
    {
      key: 'pickupPoint',
      isSatisfied: () => state.delivery !== 'storePickup' || state.pickup !== '',
      focus: () => root.querySelector<HTMLElement>('[data-pickup-card]'),
      controls: () => [],
    },
    /* Ticked, or absent because nothing is rented, means the delivery address and
       there is nothing to check. Unticked means the customer took on answering,
       so the answer has to be there. */
    fieldGate(
      context,
      'returnAddress',
      () =>
        returnSame === null ||
        returnSame.checked ||
        value('returnAddress').length >= MIN_RETURN_ADDRESS_LENGTH,
    ),
  ];
}

/**
 * The server's field paths, as the gate that owns each control. A path not
 * listed here (an item line, the notes) has no control on this page, and the
 * caller falls back to the generic failure for it.
 */
const SERVER_FIELD_GATES: Record<string, string> = {
  'customer.firstName': 'firstName',
  'customer.lastName': 'lastName',
  'customer.email': 'email',
  'customer.phone': 'phone',
  'customer.partitaIva': 'partitaIva',
  'delivery.method': 'deliveryMethod',
  'delivery.address': 'address',
  'delivery.address.line1': 'address',
  'delivery.pickupCity': 'pickupPoint',
  'delivery.returnAddress': 'returnAddress',
  'delivery.returnToSameAddress': 'returnAddress',
};

/**
 * The body sends ONE `customer.codiceFiscale`, filled from whichever field the
 * chosen identity shows — so the identity decides which control it means.
 */
function gateForServerField(path: string, customerType: string): string | undefined {
  if (path !== 'customer.codiceFiscale') return SERVER_FIELD_GATES[path];
  return customerType === 'company' ? 'companyCodiceFiscale' : 'codiceFiscale';
}

/** What the customer had answered for a gate — compared to see if it changed. */
function answerFor(context: CheckoutContext, key: string): string {
  const { state, value, returnSame } = context;
  if (key === 'deliveryMethod') return state.delivery;
  if (key === 'pickupPoint') return state.pickup;
  if (key === 'returnAddress') return `${returnSame?.checked ?? ''}|${value('returnAddress')}`;
  return value(key);
}

export interface CheckoutGates {
  /** True when the step is complete; otherwise marks every field that is not. */
  enforce: (step: StepIndex) => boolean;
  /** Clears the message of anything since answered. Wire to input/change. */
  refresh: () => void;
  /**
   * Records the fields a 422 named and returns the earliest step holding one,
   * or null when none maps to a control here. The caller opens that step, then
   * calls `revealServerErrors()`.
   */
  rejectFromServer: (fields: Record<string, string>) => StepIndex | null;
  /** Marks every rejected field on both steps, focusing and scrolling to the first. */
  revealServerErrors: () => void;
}

export function createCheckoutGates(context: CheckoutContext): CheckoutGates {
  /* One live region for both steps: only one is ever open, so a shared region
     cannot be overwritten by the other, and two would need the same text
     anyway. */
  const announce = context.root.querySelector<HTMLElement>('[data-checkout-gate-announce]');

  /** Gate key → the answer the server refused. Cleared by changing the answer. */
  const rejected = new Map<string, string>();
  const serverAccepts = (key: string) => rejected.get(key) !== answerFor(context, key);

  /* Every gate also fails while the server's refusal of its answer stands. */
  const withServerVerdict = (gates: FieldGate[]): FieldGate[] =>
    gates.map((gate) => ({
      ...gate,
      isSatisfied: () => gate.isSatisfied() && serverAccepts(gate.key),
    }));

  const details = withServerVerdict(detailGates(context));
  const delivery = withServerVerdict(deliveryGates(context));
  const detailKeys = new Set(details.map((gate) => gate.key));

  const byStep: Record<number, FormGate> = {
    1: createFormGate(context.root, details, { announce }),
    2: createFormGate(context.root, delivery, { announce }),
  };
  /* Both steps at once, in page order, so a 422 naming the email AND the
     address marks both and focuses the email. */
  const wholeForm = createFormGate(context.root, [...details, ...delivery], { announce });

  return {
    /* Step 3 has nothing to fill in — it is the review — so it is always open. */
    enforce: (step) => byStep[step]?.enforce() ?? true,
    refresh: () => {
      for (const gate of Object.values(byStep)) gate.refresh();
      wholeForm.refresh();
    },
    rejectFromServer: (fields) => {
      const keys = Object.keys(fields)
        .map((path) => gateForServerField(path, context.state.type))
        .filter((key): key is string => key !== undefined);
      if (keys.length === 0) return null;
      for (const key of keys) rejected.set(key, answerFor(context, key));
      return keys.some((key) => detailKeys.has(key)) ? 1 : 2;
    },
    revealServerErrors: () => {
      wholeForm.enforce();
    },
  };
}

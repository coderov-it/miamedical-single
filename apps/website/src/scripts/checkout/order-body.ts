/**
 * The order body, as the API reads it: what the customer chose and typed, never
 * a price. `POST /api/orders/contract-preview` takes exactly this; placement
 * adds the signed contract to it.
 */
import type { CheckoutContext } from './context.ts';

export function draftBody(context: CheckoutContext): Record<string, unknown> {
  const { state, value } = context;
  const delivery: Record<string, unknown> = { method: state.delivery };
  if (state.delivery === 'homeDelivery') {
    // The address belongs to the delivery, and only to this one: the API
    // refuses it on a collection, which is exactly the mix-up that used to be
    // possible when it was asked for in step 1.
    delivery.address = { line1: value('address') };
  } else if (state.delivery === 'storePickup') {
    delivery.pickupCity = state.pickup;
  }
  /* Sent only when the order HAS a return leg. On a purchase the fields do not
     exist, and the API refuses a return address for something never returned. */
  if (context.returnSame) {
    delivery.returnToSameAddress = context.returnSame.checked;
    if (!context.returnSame.checked) delivery.returnAddress = value('returnAddress');
  }

  const customer: Record<string, unknown> = {
    firstName: value('firstName'),
    lastName: value('lastName'),
    email: value('email'),
    phone: value('phone'),
    customerType: state.type,
  };
  if (state.type === 'private') customer.codiceFiscale = value('codiceFiscale');
  if (state.type === 'company') {
    customer.partitaIva = value('partitaIva');
    customer.codiceFiscale = value('companyCodiceFiscale');
  }

  const body: Record<string, unknown> = { items: context.orderItems, customer, delivery };
  if (value('comments')) body.notes = value('comments');
  return body;
}

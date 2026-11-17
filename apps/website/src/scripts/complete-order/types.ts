/**
 * The private order link's wire shapes, as `GET /api/order-links` sends them
 * (`apps/server/src/modules/order-links/summary.ts`). Plain copies: the browser
 * bundle must not import the server's types graph.
 */

export type CustomerType = 'private' | 'company' | 'tourist';

export interface LinkLine {
  title: string;
  quantity: number;
  unitPrice: string;
  total: string;
  rental: { packageLabel: string | null; startDate: string; endDate: string | null } | null;
  addons: { name: string; quantity: number; total: string }[];
}

export interface LinkSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  stage: 'awaiting_signature' | 'awaiting_payment' | null;
  currency: string;
  lines: LinkLine[];
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
  total: string;
  steps: { details: boolean; sign: boolean; pay: boolean };
  missingFields: string[];
  contractSigned: boolean;
  hasRental: boolean;
  expiresAt: string;
  customer: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    customerType: CustomerType | null;
    codiceFiscale: string | null;
    partitaIva: string | null;
  };
}

/** Why a link answers 410, as the server names it. */
export type GoneReason = 'revoked' | 'expired' | 'paid' | 'closed';

export interface DetailsBody {
  firstName: string;
  lastName: string;
  phone: string;
  customerType: CustomerType;
  codiceFiscale?: string;
  partitaIva?: string;
}

export interface PaymentStart {
  token: string;
  redirectUrl: string | null;
}

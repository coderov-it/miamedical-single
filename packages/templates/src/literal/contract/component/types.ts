export interface ContractCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  codiceFiscale: string | null;
  partitaIva: string | null;
  /** SDI e-invoice routing code — companies only. */
  codiceUnivoco: string | null;
  customerType: 'private' | 'company' | 'tourist';
}

export interface ContractRentalItem {
  productTitle: string;
  quantity: number;
  unitPrice: string;
  total: string;
  startDate: string;
  endDate: string | null;
  /**
   * The rented period, in `durationUnit`. It comes from the package the customer
   * chose, so it is a figure the contract can be held to rather than a span
   * recomputed from the two dates above.
   */
  duration: number;
  durationUnit: 'hour' | 'day';
}

export interface ContractDamageItem {
  description: string;
  amount: string;
}

/**
 * The customer's drawn signature, present only when rendering an already-signed
 * contract. The signing page itself renders the blank block — this is for the
 * copy an operator previews or prints afterwards.
 */
export interface ContractSignature {
  /** PNG data URL captured on the signing pad. */
  imageDataUrl: string;
  /** YYYY-MM-DD of the signature. */
  signedAt: string;
}

export interface ContractData {
  contractNumber: string;
  /** Null for manual contracts, which have no storefront order behind them. */
  orderNumber: string | null;
  customer: ContractCustomer;
  items: ContractRentalItem[];
  subtotal: string;
  shippingTotal: string;
  total: string;
  currency: string;
  requiresDeposit: boolean;
  depositAmount: string | null;
  damages: ContractDamageItem[];
  generatedAt: string;
  signature?: ContractSignature | null;
}

import type { InferResponseType } from 'hono/client';

import { api } from '~/lib/api';
import type { MessageKey } from '~/lib/ui-text';

export type ContractList = InferResponseType<typeof api.api.admin.contracts.$get, 200>['data'];
export type ContractDetail = InferResponseType<
  (typeof api.api.admin.contracts)[':id']['$get'],
  200
>['data'];
export type CustomerMatches = InferResponseType<
  typeof api.api.admin.orders.customers.$get,
  200
>['data'];
export type ProductList = InferResponseType<typeof api.api.admin.products.$get, 200>['data'];

export type CustomerType = 'private' | 'company' | 'tourist';

/** The slice of a stored contract's `contractData` that copying reads. */
export interface ContractDataShape {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    codiceFiscale: string | null;
    partitaIva: string | null;
    codiceUnivoco?: string | null;
    customerType: CustomerType;
  };
  items: {
    productTitle: string;
    quantity: number;
    unitPrice: string;
    total: string;
    duration: number;
    durationUnit: 'hour' | 'day';
  }[];
  shippingTotal: string;
  requiresDeposit: boolean;
}

export const CUSTOMER_TYPES: { value: CustomerType; labelKey: MessageKey }[] = [
  { value: 'private', labelKey: 'contracts.typePrivate' },
  { value: 'company', labelKey: 'contracts.typeCompany' },
  { value: 'tourist', labelKey: 'contracts.typeTourist' },
];

/** Row style shared by the three lookup dropdowns. */
export const RESULT_ROW_CLASS =
  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted';

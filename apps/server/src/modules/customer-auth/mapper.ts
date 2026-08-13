import type { SessionCustomer } from '../../shared/http/context.ts';
import type { CustomerDto } from './dto.ts';
import type { CustomerAccountRow } from './types.ts';

/**
 * Two sources, one wire shape: a freshly loaded row after sign-in, and the
 * context object `withCustomerSession` already resolved on later requests. The
 * session variant carries no phone, so `/me` reads the row.
 */

export function toCustomer(row: CustomerAccountRow): CustomerDto {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    isActivated: row.activatedAt !== null,
    hasPassword: row.passwordHash !== null,
  };
}

export function toCustomerFromSession(
  customer: SessionCustomer,
  phone: string | null,
): CustomerDto {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone,
    isActivated: customer.activatedAt !== null,
    hasPassword: customer.hasPassword,
  };
}

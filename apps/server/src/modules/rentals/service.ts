import type { Database } from '@mia/db';
import type { RenewRentalInput } from '@mia/validators';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as contractRepo from '../contracts/repo.ts';
import * as contractService from '../contracts/service.ts';
import * as notifications from '../notifications/service.ts';
import * as orderService from '../orders/service.ts';
import * as repo from './repo.ts';
import type { RentalListFilters, RentalRow } from './types.ts';

export async function list(
  db: Database,
  filters: RentalListFilters,
): Promise<{ rows: RentalRow[]; total: number }> {
  return repo.findMany(db, filters);
}

export async function sendReminder(db: Database, orderId: string): Promise<void> {
  const rental = await repo.findByOrderId(db, orderId);
  if (!rental) throw notFound('Rental');

  await notifications.sendRentalReminder({
    email: rental.email,
    customerName: `${rental.firstName ?? ''} ${rental.lastName ?? ''}`.trim(),
    orderNumber: rental.orderNumber,
    productTitle: rental.productTitle,
    rentalEndDate: rental.rentalEndDate ?? '',
  });
}

export async function resendContract(db: Database, orderId: string): Promise<void> {
  const contract = await contractRepo.findLatestActiveByOrderId(db, orderId);
  if (!contract) throw notFound('Contract for this order');
  await contractService.resend(db, contract.id);
}

/**
 * Renews the rental: the lines' rented period becomes the agreed span, and a
 * fresh contract for exactly that span goes out for signature. The contract is
 * not optional — this is the only renewal path, which is what guarantees no
 * rental is ever extended on a handshake.
 */
export async function renew(
  db: Database,
  orderId: string,
  input: RenewRentalInput,
  user: SessionUser,
): Promise<void> {
  const rental = await repo.findByOrderId(db, orderId);
  if (!rental) throw notFound('Rental');

  /* Checked before the period is rewritten, so a refusal leaves the order
     untouched. `generateFromOrder` re-checks the same rule afterwards. */
  const latest = await contractRepo.findLatestActiveByOrderId(db, orderId);
  if (latest && latest.status !== 'signed') {
    throw conflict(
      `Contract ${latest.number} is still awaiting signature. Resend it, or void it before renewing.`,
    );
  }

  /* The price first, before anything is rewritten: an amount that cannot be
     applied must refuse the whole renewal, not leave a renewed period at the
     old price. */
  if (input.total !== undefined) {
    const repriced = await repo.repriceSingleRentalLine(db, orderId, input.total);
    if (repriced === 'ambiguous') {
      throw httpError(
        422,
        'This order has more than one rental line, so a single renewal price cannot be applied. Renew without a price and adjust the lines individually.',
        'unprocessable_entity',
        { fields: { total: 'Not applicable to a multi-line rental.' } },
      );
    }
  }

  const durationDays = Math.round(
    (Date.parse(`${input.to}T00:00:00Z`) - Date.parse(`${input.from}T00:00:00Z`)) / 86_400_000,
  );

  await repo.updateRentalPeriods(db, orderId, input.from, input.to, durationDays);

  await contractService.generateFromOrder(db, orderId, {
    kind: 'renewal',
    actorAdminUserId: user.id,
  });
}

export async function finish(
  db: Database,
  orderId: string,
  user: SessionUser,
): Promise<void> {
  await orderService.moveStatus(db, orderId, 'fulfilled', 'Rental finished via Rent Management.', user);
}

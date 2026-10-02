import type { Database } from '@mia/db';

import type { SessionUser } from '../../shared/http/context.ts';
import { notFound } from '../../shared/http/errors.ts';
import * as contractRepo from '../contracts/repo.ts';
import * as contractService from '../contracts/service.ts';
import * as notifications from '../notifications/mail.ts';
import * as orderService from '../orders/service.ts';
import * as extensionRepo from '../rental-extensions/repo.ts';
import type { ExtensionStatus } from '../rental-extensions/types.ts';
import * as repo from './repo.ts';
import type { RentalListFilters, RentalRow } from './types.ts';

export async function list(
  db: Database,
  filters: RentalListFilters,
): Promise<{ rows: RentalRow[]; total: number; openExtensions: Map<string, ExtensionStatus> }> {
  const result = await repo.findMany(db, filters);
  const orderIds = [...new Set(result.rows.map((row) => row.orderId))];
  const openExtensions = await extensionRepo.findOpenStatusByOrderIds(db, orderIds);
  return { ...result, openExtensions };
}

export async function sendReminder(db: Database, orderId: string): Promise<void> {
  const rental = await repo.findByOrderId(db, orderId);
  if (!rental) throw notFound('Rental');

  await notifications.sendRentalReminder(
    {
      email: rental.email,
      customerName: `${rental.firstName ?? ''} ${rental.lastName ?? ''}`.trim(),
      orderNumber: rental.orderNumber,
      productTitle: rental.productTitle,
      rentalEndDate: rental.rentalEndDate ?? '',
    },
    { db, orderId },
  );
}

export async function resendContract(db: Database, orderId: string): Promise<void> {
  const contract = await contractRepo.findLatestActiveByOrderId(db, orderId);
  if (!contract) throw notFound('Contract for this order');
  await contractService.resend(db, contract.id);
}

export async function finish(db: Database, orderId: string, user: SessionUser): Promise<void> {
  await orderService.moveStatus(
    db,
    orderId,
    'fulfilled',
    'Rental finished via Rent Management.',
    user,
  );
}

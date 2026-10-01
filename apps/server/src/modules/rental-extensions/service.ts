import type { Database } from '@mia/db';
import type { LanguageCode } from '@mia/db/schema';
import type {
  AdminRequestExtensionInput,
  RecordExtensionPaymentInput,
  RequestExtensionInput,
} from '@mia/validators';

import type { SessionUser } from '../../shared/http/context.ts';
import { conflict, httpError, notFound } from '../../shared/http/errors.ts';
import * as contractRepo from '../contracts/repo.ts';
import * as contractService from '../contracts/service.ts';
import { emitToAdmins } from '../notifications/write.ts';
import type { ExtensionBlock, ExtensionOverviewDto, RentalExtensionDto } from './dto.ts';
import { toExtension, toOption } from './mapper.ts';
import { addDays, currentEndDate, extensionOptions, manualLineAmounts } from './quote.ts';
import * as repo from './repo.ts';
import type { ExtensionOption, ExtensionRow, RentalLine } from './types.ts';

/**
 * Rental extensions — lifecycle and worked example in
 * docs/code/rental-extensions.md.
 *
 *   request → renew_pending → (payment recorded) → awaiting_signature
 *           → (contract signed, see activate.ts) → active
 */

/** The equipment is back, or the order never ran: there is nothing left to extend. */
const CLOSED_ORDER_STATUSES = new Set(['fulfilled', 'cancelled', 'refunded']);

type Actor = { kind: 'customer'; id: string } | { kind: 'admin'; id: string };

interface Loaded {
  order: NonNullable<Awaited<ReturnType<typeof repo.findOrder>>>;
  lines: RentalLine[];
  endDate: string | null;
  history: ExtensionRow[];
  open: ExtensionRow | null;
  blockedBy: ExtensionBlock | null;
}

async function load(db: Database, orderId: string): Promise<Loaded> {
  const order = await repo.findOrder(db, orderId);
  if (!order) throw notFound('Order');

  const [lines, history] = await Promise.all([
    repo.findRentalLines(db, orderId),
    repo.findByOrderId(db, orderId),
  ]);
  const open = history.find((row) => repo.OPEN_STATUSES.includes(row.status)) ?? null;

  let blockedBy: ExtensionBlock | null = null;
  if (lines.length === 0) blockedBy = 'no_rental';
  else if (CLOSED_ORDER_STATUSES.has(order.status)) blockedBy = 'closed';
  else if (open) blockedBy = 'open';
  else if (lines.some((line) => line.unit === 'hour')) blockedBy = 'hourly';

  return { order, lines, endDate: currentEndDate(lines), history, open, blockedBy };
}

export async function getOverview(
  db: Database,
  orderId: string,
  locale: LanguageCode,
): Promise<ExtensionOverviewDto> {
  const loaded = await load(db, orderId);
  let options: ExtensionOption[] = [];
  if (loaded.blockedBy === null && loaded.endDate) {
    options = extensionOptions(loaded.lines, loaded.endDate, locale);
  }

  return {
    orderNumber: loaded.order.number,
    currency: loaded.order.currency,
    endDate: loaded.endDate,
    blockedBy: loaded.blockedBy,
    options: options.map(toOption),
    open: loaded.open ? toExtension(loaded.open) : null,
    history: loaded.history.map(toExtension),
  };
}

const BLOCK_MESSAGES: Record<ExtensionBlock, string> = {
  closed: 'This rental is closed — the equipment is back. Order it again instead.',
  open: 'An extension of this rental is already waiting for payment or signature.',
  hourly: 'Hourly rentals are extended by the shop. Please contact us.',
  no_rental: 'This order has no rented items to extend.',
};

/**
 * Opens an extension in `renew_pending`. The customer picks one of the offered
 * lengths; an operator may also type an agreed amount, which is the only way to
 * extend by a length no package lists.
 */
export async function request(
  db: Database,
  orderId: string,
  input: RequestExtensionInput | AdminRequestExtensionInput,
  actor: Actor,
): Promise<RentalExtensionDto> {
  const loaded = await load(db, orderId);
  if (loaded.blockedBy) throw conflict(BLOCK_MESSAGES[loaded.blockedBy]);
  if (!loaded.endDate) throw conflict('This rental has no end date to extend from.');

  const options = extensionOptions(loaded.lines, loaded.endDate, 'it');
  const option = options.find((candidate) => candidate.days === input.days);
  const agreed = 'amount' in input ? input.amount : undefined;

  if (!option && agreed === undefined) {
    const offered = options.map((candidate) => candidate.days).join(', ');
    const message = offered
      ? `Pick one of the offered lengths: ${offered} days.`
      : 'No package matches this rental. Type the agreed amount.';
    throw httpError(422, message, 'unprocessable_entity', { fields: { days: message } });
  }

  const toDate = option?.toDate ?? addDays(loaded.endDate, input.days);
  const amount = agreed ?? option?.amount ?? '0.00';
  let lineAmounts = option?.lineAmounts ?? {};
  if (agreed !== undefined) lineAmounts = manualLineAmounts(loaded.lines, agreed);

  const id = await db.transaction(async (tx) => {
    const extensionId = await repo.insert(tx, {
      orderId,
      fromDate: loaded.endDate as string,
      toDate,
      days: input.days,
      amount,
      currency: loaded.order.currency,
      lineAmounts,
      requestedByCustomerAccountId: actor.kind === 'customer' ? actor.id : null,
      requestedByAdminUserId: actor.kind === 'admin' ? actor.id : null,
    });
    const who = actor.kind === 'customer' ? 'the customer' : 'an operator';
    await repo.insertEvent(tx, {
      orderId,
      fromValue: null,
      toValue: 'renew_pending',
      note: `Extension requested by ${who}: +${input.days} days (${loaded.endDate} → ${toDate}), ${amount} ${loaded.order.currency}. Waiting for payment.`,
      actorAdminUserId: actor.kind === 'admin' ? actor.id : null,
      actorCustomerAccountId: actor.kind === 'customer' ? actor.id : null,
    });
    if (actor.kind === 'customer') {
      await emitToAdmins(tx, {
        type: 'rental.extension_requested',
        orderId,
        data: {
          orderNumber: loaded.order.number,
          days: input.days,
          amount,
          currency: loaded.order.currency,
          customerName:
            `${loaded.order.firstName ?? ''} ${loaded.order.lastName ?? ''}`.trim() || '—',
        },
      });
    }
    return extensionId;
  });

  return toExtension(await mustFind(db, id));
}

async function mustFind(db: Database, id: string): Promise<ExtensionRow> {
  const row = await repo.findById(db, id);
  if (!row) throw notFound('Extension');
  return row;
}

/**
 * The operator confirms the money arrived — the manual stand-in for online
 * payment. The renewal contract goes out in the same call, because a paid
 * extension with no paperwork is exactly the handshake this flow exists to stop.
 */
export async function recordPayment(
  db: Database,
  id: string,
  input: RecordExtensionPaymentInput,
  user: SessionUser,
): Promise<RentalExtensionDto> {
  const extension = await mustFind(db, id);
  if (extension.status !== 'renew_pending') {
    throw conflict('Payment can only be recorded on an extension waiting for payment.');
  }
  await assertNoUnsignedContract(db, extension.orderId);

  let lineAmounts = extension.lineAmounts;
  if (input.amount !== undefined && input.amount !== extension.amount) {
    lineAmounts = manualLineAmounts(
      await repo.findRentalLines(db, extension.orderId),
      input.amount,
    );
  }
  const amount = input.amount ?? extension.amount;

  await db.transaction(async (tx) => {
    await repo.update(tx, id, {
      status: 'awaiting_signature',
      amount,
      lineAmounts,
      paymentMethod: input.method,
      paymentReference: input.reference || null,
      paidAt: new Date(),
      paidByAdminUserId: user.id,
    });
    const reference = input.reference ? `, ref. ${input.reference}` : '';
    await repo.insertEvent(tx, {
      orderId: extension.orderId,
      fromValue: 'renew_pending',
      toValue: 'awaiting_signature',
      note: `Extension paid: ${amount} ${extension.currency} by ${input.method}${reference}.`,
      actorAdminUserId: user.id,
    });
  });

  return issueContract(db, id, user);
}

/** The renewal contract for a paid extension — after payment, or again after a void. */
export async function issueContract(
  db: Database,
  id: string,
  user: SessionUser,
): Promise<RentalExtensionDto> {
  const extension = await mustFind(db, id);
  if (extension.status !== 'awaiting_signature') {
    throw conflict('Only a paid extension waiting for signature gets a contract.');
  }
  if (extension.contractId && extension.contractStatus !== 'voided') {
    throw conflict(`Contract ${extension.contractNumber} is already out. Resend it instead.`);
  }

  const contract = await contractService.generateFromOrder(db, extension.orderId, {
    kind: 'renewal',
    actorAdminUserId: user.id,
    extension: {
      fromDate: extension.fromDate,
      toDate: extension.toDate,
      days: extension.days,
      lineAmounts: extension.lineAmounts,
    },
  });
  await repo.update(db, id, { contractId: contract.id });
  return toExtension(await mustFind(db, id));
}

async function assertNoUnsignedContract(db: Database, orderId: string): Promise<void> {
  const latest = await contractRepo.findLatestActiveByOrderId(db, orderId);
  if (latest && latest.status !== 'signed') {
    throw conflict(
      `Contract ${latest.number} is still awaiting signature. Resend it, or void it, before extending.`,
    );
  }
}

/**
 * Withdraws an open extension. The customer may withdraw only before paying;
 * after that, money has changed hands and an operator decides. A contract
 * already out for it is voided so it cannot be signed later.
 */
export async function cancel(
  db: Database,
  id: string,
  reason: string,
  actor: Actor,
): Promise<RentalExtensionDto> {
  const extension = await mustFind(db, id);
  if (!repo.OPEN_STATUSES.includes(extension.status)) {
    throw conflict('Only an extension still waiting for payment or signature can be cancelled.');
  }
  if (actor.kind === 'customer' && extension.status !== 'renew_pending') {
    throw conflict('This extension is already paid. Please contact us to cancel it.');
  }

  const liveContract =
    extension.contractId &&
    extension.contractStatus !== 'voided' &&
    extension.contractStatus !== 'signed';
  if (liveContract && actor.kind === 'admin' && extension.contractId) {
    await contractService.voidContract(db, extension.contractId, reason, actor.id);
  }

  await db.transaction(async (tx) => {
    await repo.update(tx, id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
    });
    await repo.insertEvent(tx, {
      orderId: extension.orderId,
      fromValue: extension.status,
      toValue: 'cancelled',
      note: `Extension +${extension.days} days cancelled: ${reason}`,
      actorAdminUserId: actor.kind === 'admin' ? actor.id : null,
      actorCustomerAccountId: actor.kind === 'customer' ? actor.id : null,
    });
  });
  return toExtension(await mustFind(db, id));
}

/** The order an extension belongs to — for the customer routes' ownership check. */
export async function orderIdOf(db: Database, id: string): Promise<string> {
  return (await mustFind(db, id)).orderId;
}

import { adminDisputeAlert } from './admin-dispute-alert.ts';
import type { EmailMessage } from './component/message.ts';
import { magicLink } from './magic-link.ts';
import { orderPlacedActivateReminder } from './order-placed-activate-reminder.ts';
import { orderPlacedConfirmation } from './order-placed-confirmation.ts';
import { orderPlacedNewAccount } from './order-placed-new-account.ts';
import { passwordReset } from './password-reset.ts';

/**
 * Every message rendered against fixture data, so a page can preview all six without
 * inventing its own fixtures — and so the fixtures live next to the templates and are
 * type-checked against them. Rename a prop and this file fails `pnpm check`.
 *
 * The names are the export names, not labels: a preview is for reading the markup, and
 * the file you edit should be obvious from what you are looking at.
 */

const ORDER = { number: 'MIA-2026-000042', total: '245.00', currency: 'EUR' };
const RECIPIENT = { firstName: 'Elena', lastName: 'Moretti' };
const SITE = 'https://miamedicalitalia.com';

export interface EmailSample {
  name: string;
  render: () => EmailMessage;
}

export const EMAIL_SAMPLES: EmailSample[] = [
  {
    name: 'orderPlacedNewAccount',
    render: () =>
      orderPlacedNewAccount({
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        activationUrl: `${SITE}/attiva-account/?token=sample`,
        reportUrl: `${SITE}/segnala-ordine/?token=sample`,
      }),
  },
  {
    name: 'orderPlacedActivateReminder',
    render: () =>
      orderPlacedActivateReminder({
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        activationUrl: `${SITE}/attiva-account/?token=sample`,
        reportUrl: `${SITE}/segnala-ordine/?token=sample`,
      }),
  },
  {
    name: 'orderPlacedConfirmation',
    render: () =>
      orderPlacedConfirmation({
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        ordersUrl: `${SITE}/area-clienti/ordini/`,
        reportUrl: `${SITE}/segnala-ordine/?token=sample`,
      }),
  },
  {
    name: 'magicLink',
    render: () =>
      magicLink({ to: 'elena.moretti@example.it', url: `${SITE}/accedi/?token=sample` }),
  },
  {
    name: 'passwordReset',
    render: () =>
      passwordReset({
        to: 'elena.moretti@example.it',
        url: `${SITE}/reimposta-password/?token=sample`,
      }),
  },
  {
    name: 'adminDisputeAlert',
    render: () =>
      adminDisputeAlert({
        to: ['ordini@miamedicalitalia.com'],
        order: ORDER,
        orderEmail: 'elena.moretti@example.it',
        reportedPhone: '+39 333 111 2223',
        message: 'Non ho ordinato niente,\nnon conosco questo ordine.',
        adminUrl: 'https://admin.miamedicalitalia.com/order-disputes/sample',
      }),
  },
];

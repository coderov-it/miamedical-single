import { accountDeletionCode } from './account-deletion-code.ts';
import { adminDisputeAlert } from './admin-dispute-alert.ts';
import type { EmailLanguage } from './component/language.ts';
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
  /** Customer messages render in `language`; the internal alert ignores it. */
  render: (language?: EmailLanguage) => EmailMessage;
}

export const EMAIL_SAMPLES: EmailSample[] = [
  {
    name: 'orderPlacedNewAccount',
    render: (language = 'it') =>
      orderPlacedNewAccount({
        language,
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        activationUrl: `${SITE}/activate-account/?token=sample`,
        reportUrl: `${SITE}/report-order/?token=sample`,
      }),
  },
  {
    name: 'orderPlacedActivateReminder',
    render: (language = 'it') =>
      orderPlacedActivateReminder({
        language,
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        activationUrl: `${SITE}/activate-account/?token=sample`,
        reportUrl: `${SITE}/report-order/?token=sample`,
      }),
  },
  {
    name: 'orderPlacedConfirmation',
    render: (language = 'it') =>
      orderPlacedConfirmation({
        language,
        to: 'elena.moretti@example.it',
        recipient: RECIPIENT,
        order: ORDER,
        ordersUrl: `${SITE}/account/orders/`,
        reportUrl: `${SITE}/report-order/?token=sample`,
      }),
  },
  {
    name: 'magicLink',
    render: (language = 'it') =>
      magicLink({
        language,
        to: 'elena.moretti@example.it',
        url: `${SITE}/activate-account/?token=sample`,
        variant: 'signIn',
      }),
  },
  {
    name: 'magicLinkFirstSignIn',
    render: (language = 'it') =>
      magicLink({
        language,
        to: 'elena.moretti@example.it',
        url: `${SITE}/activate-account/?token=sample`,
        variant: 'firstSignIn',
      }),
  },
  {
    name: 'magicLinkRegister',
    render: (language = 'it') =>
      magicLink({
        language,
        to: 'elena.moretti@example.it',
        url: `${SITE}/activate-account/?token=sample`,
        variant: 'register',
      }),
  },
  {
    name: 'passwordReset',
    render: (language = 'it') =>
      passwordReset({
        language,
        to: 'elena.moretti@example.it',
        url: `${SITE}/reset-password/?token=sample`,
      }),
  },
  {
    name: 'accountDeletionCode',
    render: (language = 'it') =>
      accountDeletionCode({ to: 'elena.moretti@example.it', code: '482915', language }),
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

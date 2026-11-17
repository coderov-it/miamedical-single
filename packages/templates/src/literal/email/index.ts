/**
 * The six messages this platform sends.
 *
 * One file per message at this level; everything reused sits in `component/`. A message
 * file is a template literal with pieces spliced into it, so it reads as the markup it
 * produces:
 *
 * ```ts
 * html: `${header({ heading: subject })}
 * ${paragraph({ text: greeting(input.recipient) })}
 * ${button({ href: input.activationUrl, label: copy.label })}
 * ${footer({ audience: 'customer' })}`
 * ```
 *
 * Customer copy exists in every `EmailLanguage` and each message takes the reader's
 * `language`; the contract emails follow the contract's own language instead.
 * `adminDisputeAlert` is English only: its audience is the operations team.
 *
 * Both bodies are always produced. The text body is not an afterthought — it is what
 * the console transport prints in development, so every link must be readable in it.
 *
 * Why template literals and not a template engine, with the benchmark that settled it:
 * `docs/code/notifications-and-mail.md`.
 */

export { accountDeletionCode } from './account-deletion-code.ts';
export { adminDisputeAlert } from './admin-dispute-alert.ts';
export { escapeHtml } from './component/escape.ts';
export type { Audience } from './component/audience.ts';
export type { EmailLanguage } from './component/language.ts';
export type { EmailMessage } from './component/message.ts';
export type { OrderRef, Recipient } from './component/order.ts';
export { magicLink, type MagicLinkVariant } from './magic-link.ts';
export { manualOrderLink, type ManualOrderLinkSteps } from './manual-order-link.ts';
export { orderPlacedActivateReminder } from './order-placed-activate-reminder.ts';
export { orderPlacedConfirmation } from './order-placed-confirmation.ts';
export { orderPlacedNewAccount } from './order-placed-new-account.ts';
export { passwordReset } from './password-reset.ts';
export { contractReady } from './contract-ready.ts';
export { contractSigned } from './contract-signed.ts';
export { rentalReminder } from './rental-reminder.ts';

import type { EmailLanguage, Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import type { OrderRef, Recipient } from './component/order.ts';
import { orderEmail, type OrderEmailSection } from './component/order-email.ts';

/**
 * First order from an address we have never seen: the account exists but nobody has
 * claimed it. One message does both jobs — confirms the order and invites them in —
 * because two emails for one event reads as a mistake.
 *
 * Two sections, because there are two subjects: the order, which is settled and needs
 * nothing from them, and the account, which needs one click. The frame they share
 * with the other two order emails is `component/order-email.ts`.
 */

const COPY: Translated<Omit<OrderEmailSection, 'href'>> = {
  it: {
    afterThanks: 'Ti contatteremo su WhatsApp per confermare i dettagli.',
    title: 'La tua area clienti',
    body: 'Abbiamo creato la tua area clienti: attivala per seguire questo ordine e vedere quelli futuri.',
    textLead: 'Abbiamo creato la tua area clienti. Attivala qui:',
    label: 'Attiva il tuo account',
    note: 'Il link è valido per 7 giorni e può essere usato una sola volta.',
  },
  en: {
    afterThanks: 'We will contact you on WhatsApp to confirm the details.',
    title: 'Your customer area',
    body: 'We have created your customer area: activate it to follow this order and see future ones.',
    textLead: 'We have created your customer area. Activate it here:',
    label: 'Activate your account',
    note: 'The link is valid for 7 days and can be used only once.',
  },
  fr: {
    afterThanks: 'Nous vous contacterons sur WhatsApp pour confirmer les détails.',
    title: 'Votre espace client',
    body: 'Nous avons créé votre espace client : activez-le pour suivre cette commande et voir les prochaines.',
    textLead: 'Nous avons créé votre espace client. Activez-le ici :',
    label: 'Activer votre compte',
    note: 'Le lien est valable 7 jours et ne peut être utilisé qu’une seule fois.',
  },
  de: {
    afterThanks: 'Wir kontaktieren Sie über WhatsApp, um die Details zu bestätigen.',
    title: 'Ihr Kundenbereich',
    body: 'Wir haben Ihren Kundenbereich angelegt: Aktivieren Sie ihn, um diese und künftige Bestellungen zu verfolgen.',
    textLead: 'Wir haben Ihren Kundenbereich angelegt. Hier aktivieren:',
    label: 'Konto aktivieren',
    note: 'Der Link ist 7 Tage gültig und kann nur einmal verwendet werden.',
  },
};

export function orderPlacedNewAccount(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  activationUrl: string;
  reportUrl: string;
  language: EmailLanguage;
}): EmailMessage {
  return orderEmail({
    ...input,
    section: { ...COPY[input.language], href: input.activationUrl },
  });
}

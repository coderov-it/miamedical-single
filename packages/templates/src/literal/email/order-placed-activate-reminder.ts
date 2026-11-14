import type { EmailLanguage, Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import type { OrderRef, Recipient } from './component/order.ts';
import { orderEmail, type OrderEmailSection } from './component/order-email.ts';

/** They have ordered before but never activated. Same offer, different framing. */

const COPY: Translated<Omit<OrderEmailSection, 'href'>> = {
  it: {
    title: 'La tua area clienti',
    body: 'La tua area clienti non è ancora attiva. Attivandola trovi questo ordine e tutti i precedenti in un unico posto.',
    textLead: 'La tua area clienti non è ancora attiva. Attivala qui:',
    label: 'Attiva il tuo account',
  },
  en: {
    title: 'Your customer area',
    body: 'Your customer area is not active yet. Activate it to find this order and all earlier ones in one place.',
    textLead: 'Your customer area is not active yet. Activate it here:',
    label: 'Activate your account',
  },
  fr: {
    title: 'Votre espace client',
    body: 'Votre espace client n’est pas encore actif. Activez-le pour retrouver cette commande et toutes les précédentes au même endroit.',
    textLead: 'Votre espace client n’est pas encore actif. Activez-le ici :',
    label: 'Activer votre compte',
  },
  de: {
    title: 'Ihr Kundenbereich',
    body: 'Ihr Kundenbereich ist noch nicht aktiv. Aktivieren Sie ihn, um diese und alle früheren Bestellungen an einem Ort zu finden.',
    textLead: 'Ihr Kundenbereich ist noch nicht aktiv. Hier aktivieren:',
    label: 'Konto aktivieren',
  },
};

export function orderPlacedActivateReminder(input: {
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

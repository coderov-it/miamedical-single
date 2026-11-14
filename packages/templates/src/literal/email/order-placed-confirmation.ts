import type { EmailLanguage, Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import type { OrderRef, Recipient } from './component/order.ts';
import { orderEmail, type OrderEmailSection } from './component/order-email.ts';

/**
 * The account is already theirs, so this is a plain confirmation. It still carries the
 * report link — see `component/report-link.ts` for why all three order emails do.
 */

const COPY: Translated<Omit<OrderEmailSection, 'href'>> = {
  it: {
    title: 'Segui il tuo ordine',
    body: 'Trovi questo ordine e tutti i precedenti nella tua area clienti.',
    textLead: 'Trovi questo ordine e tutti i precedenti qui:',
    label: 'Vedi i tuoi ordini',
  },
  en: {
    title: 'Follow your order',
    body: 'You will find this order and all earlier ones in your customer area.',
    textLead: 'You will find this order and all earlier ones here:',
    label: 'See your orders',
  },
  fr: {
    title: 'Suivez votre commande',
    body: 'Vous retrouverez cette commande et toutes les précédentes dans votre espace client.',
    textLead: 'Vous retrouverez cette commande et toutes les précédentes ici :',
    label: 'Voir vos commandes',
  },
  de: {
    title: 'Verfolgen Sie Ihre Bestellung',
    body: 'Diese und alle früheren Bestellungen finden Sie in Ihrem Kundenbereich.',
    textLead: 'Diese und alle früheren Bestellungen finden Sie hier:',
    label: 'Ihre Bestellungen ansehen',
  },
};

export function orderPlacedConfirmation(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  ordersUrl: string;
  reportUrl: string;
  language: EmailLanguage;
}): EmailMessage {
  return orderEmail({
    ...input,
    section: { ...COPY[input.language], href: input.ordersUrl },
  });
}

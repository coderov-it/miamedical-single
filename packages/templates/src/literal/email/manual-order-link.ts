import { button } from './component/button.ts';
import { footer } from './component/footer.ts';
import { header } from './component/header.ts';
import { LOCALE_TAG, type EmailLanguage, type Translated } from './component/language.ts';
import type { EmailMessage } from './component/message.ts';
import { greeting, money, orderLine, type OrderRef, type Recipient } from './component/order.ts';
import { paragraph } from './component/paragraph.ts';
import { reportLink } from './component/report-link.ts';
import { subheading } from './component/subheading.ts';
import { reportLinkText, textBody } from './component/text.ts';

/**
 * An agent created this order for the customer (phone, chat) and sends a private link to
 * finish it. The steps the link allows decide the list of things to do, so a customer
 * who only has to pay is not told to sign. Docs: `docs/code/manual-orders.md`.
 *
 * ```
 * steps sign_pay, details on  →  1. details  2. sign  3. pay
 * steps pay                   →  1. pay
 * steps sign                  →  1. sign
 * ```
 */

export type ManualOrderLinkSteps = 'sign_pay' | 'sign' | 'pay';

interface Copy {
  subject: (number: string) => string;
  intro: string;
  todoTitle: string;
  details: string;
  sign: string;
  pay: string;
  orderSection: string;
  discount: string;
  expires: (date: string) => string;
  label: string;
  textLead: string;
  report: { question: string; textLead: string };
}

const COPY: Translated<Copy> = {
  it: {
    subject: (number) => `Completa il tuo ordine ${number}`,
    intro:
      'Abbiamo preparato un ordine per te. Per completarlo bastano pochi passaggi, direttamente online.',
    todoTitle: 'Cosa devi fare',
    details: 'Controlla e completa i tuoi dati',
    sign: 'Leggi e firma il contratto di noleggio',
    pay: 'Paga online in modo sicuro',
    orderSection: 'Il tuo ordine',
    discount: 'Sconto',
    expires: (date) => `Il link è valido fino al ${date}.`,
    label: 'Completa il tuo ordine',
    textLead: 'Completa il tuo ordine qui:',
    report: {
      question: 'Non hai richiesto tu questo ordine? Clicca qui.',
      textLead: 'Non hai richiesto tu questo ordine? Segnalacelo qui:',
    },
  },
  en: {
    subject: (number) => `Complete your order ${number}`,
    intro: 'We have prepared an order for you. A few steps, all online, are enough to complete it.',
    todoTitle: 'What you need to do',
    details: 'Check and complete your details',
    sign: 'Read and sign the rental contract',
    pay: 'Pay securely online',
    orderSection: 'Your order',
    discount: 'Discount',
    expires: (date) => `The link is valid until ${date}.`,
    label: 'Complete your order',
    textLead: 'Complete your order here:',
    report: {
      question: 'Didn’t ask for this order? Click here.',
      textLead: 'Didn’t ask for this order? Tell us here:',
    },
  },
  fr: {
    subject: (number) => `Finalisez votre commande ${number}`,
    intro:
      'Nous avons préparé une commande pour vous. Quelques étapes en ligne suffisent pour la finaliser.',
    todoTitle: 'Ce que vous avez à faire',
    details: 'Vérifier et compléter vos informations',
    sign: 'Lire et signer le contrat de location',
    pay: 'Payer en ligne en toute sécurité',
    orderSection: 'Votre commande',
    discount: 'Remise',
    expires: (date) => `Le lien est valable jusqu’au ${date}.`,
    label: 'Finaliser votre commande',
    textLead: 'Finalisez votre commande ici :',
    report: {
      question: 'Vous n’avez pas demandé cette commande ? Cliquez ici.',
      textLead: 'Vous n’avez pas demandé cette commande ? Signalez-le ici :',
    },
  },
  de: {
    subject: (number) => `Schließen Sie Ihre Bestellung ${number} ab`,
    intro:
      'Wir haben eine Bestellung für Sie vorbereitet. Mit wenigen Schritten online schließen Sie sie ab.',
    todoTitle: 'Was Sie tun müssen',
    details: 'Ihre Daten prüfen und ergänzen',
    sign: 'Den Mietvertrag lesen und unterschreiben',
    pay: 'Sicher online bezahlen',
    orderSection: 'Ihre Bestellung',
    discount: 'Rabatt',
    expires: (date) => `Der Link ist gültig bis ${date}.`,
    label: 'Bestellung abschließen',
    textLead: 'Bestellung hier abschließen:',
    report: {
      question: 'Sie haben diese Bestellung nicht aufgegeben? Hier klicken.',
      textLead: 'Sie haben diese Bestellung nicht aufgegeben? Melden Sie es hier:',
    },
  },
};

/** "1 dicembre 2026", in the shop's own time zone so the date matches what the agent saw. */
function longDate(iso: string, language: EmailLanguage): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[language], {
    dateStyle: 'long',
    timeZone: 'Europe/Rome',
  }).format(new Date(iso));
}

function todoList(
  copy: Copy,
  input: { steps: ManualOrderLinkSteps; includeDetails: boolean },
): string[] {
  const todo: string[] = [];
  if (input.includeDetails) todo.push(copy.details);
  if (input.steps !== 'pay') todo.push(copy.sign);
  if (input.steps !== 'sign') todo.push(copy.pay);
  return todo.map((text, index) => `${index + 1}. ${text}`);
}

export function manualOrderLink(input: {
  to: string;
  recipient: Recipient;
  order: OrderRef;
  /** The order-level discount, "0.00" or absent when there is none. */
  discount?: string;
  steps: ManualOrderLinkSteps;
  includeDetails: boolean;
  /** The link, the "didn't ask for this order" page, and when the link stops working. */
  url: string;
  reportUrl: string;
  expiresAt: string;
  language: EmailLanguage;
}): EmailMessage {
  const { language } = input;
  const copy = COPY[language];
  const subject = copy.subject(input.order.number);
  const hello = greeting(input.recipient, language);
  const line = orderLine(input.order, language);
  const hasDiscount = Number(input.discount ?? 0) > 0;
  const discountLine = `${copy.discount}: −${money(input.discount ?? '0', input.order.currency, language)}`;
  const expires = copy.expires(longDate(input.expiresAt, language));
  const todo = todoList(copy, input);
  const discountHtml = hasDiscount ? paragraph({ text: discountLine }) : '';

  return {
    to: [input.to],
    subject,
    html: `${header({ heading: subject, audience: 'customer', language })}
${paragraph({ text: hello })}
${paragraph({ text: copy.intro })}
${subheading({ text: copy.todoTitle })}
${todo.map((text) => paragraph({ text })).join('\n')}
${button({ href: input.url, label: copy.label })}
${subheading({ text: copy.orderSection })}
${paragraph({ text: line })}
${discountHtml}
${paragraph({ text: expires })}
${reportLink({ reportUrl: input.reportUrl, language, copy: copy.report })}
${footer({ audience: 'customer', language })}`,
    text: textBody(
      [
        hello,
        '',
        copy.intro,
        '',
        copy.todoTitle.toUpperCase(),
        ...todo,
        '',
        copy.textLead,
        input.url,
        '',
        copy.orderSection.toUpperCase(),
        line,
        ...(hasDiscount ? [discountLine] : []),
        expires,
        '',
        reportLinkText({ reportUrl: input.reportUrl, language, copy: copy.report }),
      ],
      'customer',
      language,
    ),
  };
}

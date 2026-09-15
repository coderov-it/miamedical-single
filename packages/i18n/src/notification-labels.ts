import type { NotificationCategory, NotificationType } from '@mia/validators';

import { createLabels, type LabelEntry } from './label-map.ts';

/**
 * What a notification says, in every registered language.
 *
 * This is the other half of the design in `@mia/validators/notification`: a row
 * stores `type: 'rental.ending_soon'` and `{ orderNumber, endsOn, daysLeft }`,
 * never a sentence, so the words are chosen here at render time from the
 * reader's own locale. One row reads in four languages, a copy fix reaches rows
 * written last year, and a fifth language needs no migration.
 *
 * Both audiences read from this one catalog. An operator's feed and a
 * customer's feed for the same event say different things — "A customer placed
 * an order" against "We have received your order" — so an event that reaches
 * both carries `.admin` entries alongside the customer ones.
 *
 * `satisfies Record<NotificationLabelKey, LabelEntry>` is what keeps the two
 * files in step: adding an event to the catalogue fails `tsc` here until its
 * title and body exist. What it does NOT demand is every language — `LabelEntry`
 * leaves each optional and `createLabels` falls back to English and then to a
 * humanised key, because a notification arriving in the wrong language beats one
 * arriving blank while copy is still being written.
 *
 * Placeholders are `{name}` and interpolate from the row's own `data`. Only keys
 * that exist on the payload may be named — the caller passes `data` straight
 * through — and an unknown one renders as the literal `{name}` rather than
 * throwing, which is the correct failure for copy that outran a payload.
 */

/** Titles and bodies for the customer feed, plus an admin variant where one is needed. */
type NotificationLabelKey =
  | `${NotificationType}.title`
  | `${NotificationType}.body`
  | `${AdminEvent}.admin.title`
  | `${AdminEvent}.admin.body`;

/** The events an operator is told about. Their customer entries may be unused. */
type AdminEvent =
  | 'order.placed'
  | 'order.link_disputed'
  | 'contract.signed'
  | 'contract.unsigned_blocking'
  | 'rental.ending_soon';

export const NOTIFICATION_LABELS = {
  // --- orders ---------------------------------------------------------------
  'order.placed.title': {
    it: 'Ordine ricevuto',
    en: 'Order received',
    fr: 'Commande reçue',
    de: 'Bestellung eingegangen',
  },
  'order.placed.body': {
    it: 'Abbiamo ricevuto il tuo ordine {orderNumber}.',
    en: 'We have received your order {orderNumber}.',
    fr: 'Nous avons bien reçu votre commande {orderNumber}.',
    de: 'Wir haben Ihre Bestellung {orderNumber} erhalten.',
  },
  'order.placed.admin.title': {
    it: 'Nuovo ordine',
    en: 'New order',
    fr: 'Nouvelle commande',
    de: 'Neue Bestellung',
  },
  'order.placed.admin.body': {
    it: '{customerName} ha effettuato l’ordine {orderNumber} — {total} {currency}.',
    en: '{customerName} placed order {orderNumber} — {total} {currency}.',
    fr: '{customerName} a passé la commande {orderNumber} — {total} {currency}.',
    de: '{customerName} hat Bestellung {orderNumber} aufgegeben — {total} {currency}.',
  },

  'order.status_changed.title': {
    it: 'Aggiornamento ordine',
    en: 'Order update',
    fr: 'Mise à jour de la commande',
    de: 'Bestellungsaktualisierung',
  },
  'order.status_changed.body': {
    it: 'Il tuo ordine {orderNumber} è ora {to}.',
    en: 'Your order {orderNumber} is now {to}.',
    fr: 'Votre commande {orderNumber} est désormais {to}.',
    de: 'Ihre Bestellung {orderNumber} ist jetzt {to}.',
  },

  'order.upcoming.title': {
    it: 'Il tuo noleggio sta per iniziare',
    en: 'Your rental starts soon',
    fr: 'Votre location commence bientôt',
    de: 'Ihre Miete beginnt bald',
  },
  'order.upcoming.body': {
    it: 'Il noleggio dell’ordine {orderNumber} inizia il {startsOn}.',
    en: 'The rental on order {orderNumber} starts on {startsOn}.',
    fr: 'La location de la commande {orderNumber} commence le {startsOn}.',
    de: 'Die Miete zu Bestellung {orderNumber} beginnt am {startsOn}.',
  },

  'order.link_disputed.title': {
    it: 'Ordine contestato',
    en: 'Order disputed',
    fr: 'Commande contestée',
    de: 'Bestellung angefochten',
  },
  'order.link_disputed.body': {
    it: 'È stata aperta una segnalazione sull’ordine {orderNumber}.',
    en: 'A report has been filed about order {orderNumber}.',
    fr: 'Un signalement a été déposé concernant la commande {orderNumber}.',
    de: 'Zu Bestellung {orderNumber} wurde eine Meldung eingereicht.',
  },
  'order.link_disputed.admin.title': {
    it: 'Ordine contestato',
    en: 'Order disputed',
    fr: 'Commande contestée',
    de: 'Bestellung angefochten',
  },
  'order.link_disputed.admin.body': {
    it: 'Qualcuno dichiara di non aver effettuato l’ordine {orderNumber}.',
    en: 'Someone says they did not place order {orderNumber}.',
    fr: 'Quelqu’un déclare ne pas avoir passé la commande {orderNumber}.',
    de: 'Jemand gibt an, Bestellung {orderNumber} nicht aufgegeben zu haben.',
  },

  // --- rentals --------------------------------------------------------------
  'rental.ending_soon.title': {
    it: 'Il tuo noleggio sta per scadere',
    en: 'Your rental is ending soon',
    fr: 'Votre location se termine bientôt',
    de: 'Ihre Miete endet bald',
  },
  'rental.ending_soon.body': {
    it: 'Il noleggio dell’ordine {orderNumber} termina il {endsOn}.',
    en: 'The rental on order {orderNumber} ends on {endsOn}.',
    fr: 'La location de la commande {orderNumber} se termine le {endsOn}.',
    de: 'Die Miete zu Bestellung {orderNumber} endet am {endsOn}.',
  },
  'rental.ending_soon.admin.title': {
    it: 'Noleggio in scadenza',
    en: 'Rental ending soon',
    fr: 'Location bientôt terminée',
    de: 'Miete endet bald',
  },
  'rental.ending_soon.admin.body': {
    it: 'Il noleggio di {customerName} — ordine {orderNumber} — termina il {endsOn}.',
    en: '{customerName}’s rental — order {orderNumber} — ends on {endsOn}.',
    fr: 'La location de {customerName} — commande {orderNumber} — se termine le {endsOn}.',
    de: 'Die Miete von {customerName} — Bestellung {orderNumber} — endet am {endsOn}.',
  },

  'rental.renewed.title': {
    it: 'Noleggio rinnovato',
    en: 'Rental renewed',
    fr: 'Location renouvelée',
    de: 'Miete verlängert',
  },
  'rental.renewed.body': {
    it: 'Il noleggio dell’ordine {orderNumber} è stato esteso fino al {to}.',
    en: 'The rental on order {orderNumber} has been extended to {to}.',
    fr: 'La location de la commande {orderNumber} a été prolongée jusqu’au {to}.',
    de: 'Die Miete zu Bestellung {orderNumber} wurde bis zum {to} verlängert.',
  },

  // --- contracts ------------------------------------------------------------
  'contract.awaiting_signature.title': {
    it: 'Contratto da firmare',
    en: 'Contract to sign',
    fr: 'Contrat à signer',
    de: 'Vertrag zu unterschreiben',
  },
  'contract.awaiting_signature.body': {
    it: 'Il contratto {contractNumber} è in attesa della tua firma.',
    en: 'Contract {contractNumber} is waiting for your signature.',
    fr: 'Le contrat {contractNumber} attend votre signature.',
    de: 'Vertrag {contractNumber} wartet auf Ihre Unterschrift.',
  },

  'contract.signed.title': {
    it: 'Contratto firmato',
    en: 'Contract signed',
    fr: 'Contrat signé',
    de: 'Vertrag unterschrieben',
  },
  'contract.signed.body': {
    it: 'Abbiamo registrato la tua firma sul contratto {contractNumber}.',
    en: 'We have recorded your signature on contract {contractNumber}.',
    fr: 'Nous avons enregistré votre signature sur le contrat {contractNumber}.',
    de: 'Wir haben Ihre Unterschrift auf Vertrag {contractNumber} erfasst.',
  },
  'contract.signed.admin.title': {
    it: 'Contratto firmato',
    en: 'Contract signed',
    fr: 'Contrat signé',
    de: 'Vertrag unterschrieben',
  },
  'contract.signed.admin.body': {
    it: '{customerName} ha firmato il contratto {contractNumber}.',
    en: '{customerName} signed contract {contractNumber}.',
    fr: '{customerName} a signé le contrat {contractNumber}.',
    de: '{customerName} hat Vertrag {contractNumber} unterschrieben.',
  },

  'contract.unsigned_blocking.title': {
    it: 'Contratto ancora da firmare',
    en: 'Contract still unsigned',
    fr: 'Contrat toujours non signé',
    de: 'Vertrag noch nicht unterschrieben',
  },
  'contract.unsigned_blocking.body': {
    it: 'Il contratto {contractNumber} attende la firma dal {sentOn}.',
    en: 'Contract {contractNumber} has been waiting for a signature since {sentOn}.',
    fr: 'Le contrat {contractNumber} attend une signature depuis le {sentOn}.',
    de: 'Vertrag {contractNumber} wartet seit {sentOn} auf eine Unterschrift.',
  },
  'contract.unsigned_blocking.admin.title': {
    it: 'Ordine bloccato: contratto non firmato',
    en: 'Order stalled: contract unsigned',
    fr: 'Commande bloquée : contrat non signé',
    de: 'Bestellung blockiert: Vertrag nicht unterschrieben',
  },
  'contract.unsigned_blocking.admin.body': {
    it: 'L’ordine {orderNumber} attende la firma del contratto {contractNumber} da {hoursWaiting} ore.',
    en: 'Order {orderNumber} has been waiting {hoursWaiting} hours for contract {contractNumber} to be signed.',
    fr: 'La commande {orderNumber} attend depuis {hoursWaiting} heures la signature du contrat {contractNumber}.',
    de: 'Bestellung {orderNumber} wartet seit {hoursWaiting} Stunden auf die Unterschrift zu Vertrag {contractNumber}.',
  },
} as const satisfies Record<NotificationLabelKey, LabelEntry>;

/**
 * The words around the feed rather than in it — the heading, the empty state,
 * the actions. Kept beside the event copy so the whole screen follows one
 * language, instead of the list translating and the empty state staying put.
 *
 * Open-ended rather than `satisfies` a union: this is ordinary UI copy, and
 * nothing about adding a screen label should be able to fail a build.
 */
export const NOTIFICATION_UI_LABELS = {
  heading: {
    it: 'Notifiche',
    en: 'Notifications',
    fr: 'Notifications',
    de: 'Benachrichtigungen',
  },
  empty: {
    it: 'Nessuna notifica.',
    en: 'Nothing here yet.',
    fr: 'Rien pour le moment.',
    de: 'Noch nichts vorhanden.',
  },
  emptyHint: {
    it: 'Ordini, contratti e scadenze di noleggio compariranno qui.',
    en: 'Orders, contracts and rental deadlines will show up here.',
    fr: 'Les commandes, contrats et échéances de location apparaîtront ici.',
    de: 'Bestellungen, Verträge und Mietfristen erscheinen hier.',
  },
  markAllRead: {
    it: 'Segna tutte come lette',
    en: 'Mark all as read',
    fr: 'Tout marquer comme lu',
    de: 'Alle als gelesen markieren',
  },
  unreadCount: {
    it: '{count} da leggere',
    en: '{count} unread',
    fr: '{count} non lues',
    de: '{count} ungelesen',
  },
  openOrder: {
    it: 'Apri ordine',
    en: 'Open order',
    fr: 'Ouvrir la commande',
    de: 'Bestellung öffnen',
  },
  reconnecting: {
    it: 'Riconnessione in corso…',
    en: 'Reconnecting…',
    fr: 'Reconnexion…',
    de: 'Verbindung wird wiederhergestellt…',
  },
  loadMore: {
    it: 'Carica altre',
    en: 'Load more',
    fr: 'Charger plus',
    de: 'Mehr laden',
  },
  seeInInbox: {
    it: 'Vedi tutte le notifiche',
    en: 'See all in inbox',
    fr: 'Tout voir dans la boîte',
    de: 'Alle im Posteingang',
  },
  latest: {
    it: 'Ultime notifiche',
    en: 'Latest',
    fr: 'Dernières',
    de: 'Neueste',
  },
  filterHeading: {
    it: 'Categorie',
    en: 'Categories',
    fr: 'Catégories',
    de: 'Kategorien',
  },
  unreadOnly: {
    it: 'Solo da leggere',
    en: 'Unread only',
    fr: 'Non lues seulement',
    de: 'Nur ungelesene',
  },
  allCaughtUp: {
    it: 'Tutto letto.',
    en: 'All caught up.',
    fr: 'Tout est lu.',
    de: 'Alles gelesen.',
  },
  live: {
    it: 'In diretta',
    en: 'Live',
    fr: 'En direct',
    de: 'Live',
  },
} as const satisfies Record<string, LabelEntry>;

/**
 * The filter rail's names. Plural, because each is a bucket rather than an
 * event — "Orders", not "Order update".
 *
 * `satisfies Record<NotificationCategory | 'all', LabelEntry>` so registering a
 * category without naming it fails `tsc` rather than rendering `Payment` in
 * four languages by accident.
 */
export const NOTIFICATION_CATEGORY_LABELS = {
  all: { it: 'Tutte', en: 'All', fr: 'Toutes', de: 'Alle' },
  order: { it: 'Ordini', en: 'Orders', fr: 'Commandes', de: 'Bestellungen' },
  rental: { it: 'Noleggi', en: 'Rentals', fr: 'Locations', de: 'Mieten' },
  contract: { it: 'Contratti', en: 'Contracts', fr: 'Contrats', de: 'Verträge' },
} as const satisfies Record<NotificationCategory | 'all', LabelEntry>;

/** `notificationCategoryLabel('rental', 'fr')` → "Locations". */
export const notificationCategoryLabel = createLabels(NOTIFICATION_CATEGORY_LABELS);

/** `notificationUiLabel('markAllRead', 'fr')`. */
export const notificationUiLabel = createLabels(NOTIFICATION_UI_LABELS);

/**
 * `notificationLabel('order.placed.admin.title', 'de')`.
 *
 * Keyed to the catalog, so a misspelled key is a compile error rather than a
 * humanised key on the page.
 */
export const notificationLabel = createLabels(NOTIFICATION_LABELS);

export type NotificationLabelName = keyof typeof NOTIFICATION_LABELS;

/**
 * The key pair for one row, given its audience.
 *
 * An admin feed prefers the `.admin` variant and falls back to the customer
 * wording where no operator-specific phrasing exists — a difference in
 * addressee, not in meaning, and inventing a second sentence for every event
 * would mean writing eight languages of copy nobody asked for.
 */
export function notificationKeys(
  type: string,
  audience: 'customer' | 'admin',
): { title: NotificationLabelName; body: NotificationLabelName } {
  if (audience === 'admin') {
    const adminTitle = `${type}.admin.title`;
    if (adminTitle in NOTIFICATION_LABELS) {
      return {
        title: adminTitle as NotificationLabelName,
        body: `${type}.admin.body` as NotificationLabelName,
      };
    }
  }
  return {
    title: `${type}.title` as NotificationLabelName,
    body: `${type}.body` as NotificationLabelName,
  };
}

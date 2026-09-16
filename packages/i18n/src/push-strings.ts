import { LANGUAGE_CODES, languageOf, type LanguageCode } from '@mia/validators/language';
import type { NotificationData, NotificationType } from '@mia/validators/notification';

import { ORDER_STATUS, PAYMENT_STATUS } from './enum-labels.ts';
import { NOTIFICATION_LABELS } from './notification-labels.ts';

/**
 * The strings a PHONE renders, and the keys that name them.
 *
 * A push is drawn by the operating system while the app is closed, so no code of
 * ours runs and no catalogue is loaded. The OS looks the key up in the app's own
 * compiled resources — `strings.xml`, `Localizable.strings` — and fills in the
 * positional arguments we send. Those files are GENERATED from this module by
 * `scripts/generate-native-strings.ts`, so the copy still lives in one place.
 *
 * Two rules follow from the OS doing the rendering, and both shape everything
 * below:
 *
 *  1. **An argument is printed verbatim.** It can never be translated, so only
 *     order numbers, contract numbers and proper nouns may be arguments.
 *  2. **There is no formatter.** A date arrives as whatever string we send, and
 *     a count cannot choose a plural form.
 *
 * Which is why anything variable and translatable is folded into the KEY instead
 * — a status becomes `…_paid`, a day count becomes `…_3d`. Both are closed sets,
 * so this costs a handful of generated strings and buys copy that is correct in
 * four languages with no formatter and no plural rules.
 */

/** Only these four events may reach a lock screen — see `PUSH_BY_DEFAULT`. */
const PUSHABLE = [
  'order.status_changed',
  'order.upcoming',
  'rental.ending_soon',
  'contract.awaiting_signature',
] as const;

export type PushableNotificationType = (typeof PUSHABLE)[number];

/**
 * The positional arguments each event sends, in order.
 *
 * ⚠️ THIS IS THE CONTRACT with the generated `%1$s` / `%1$@` placeholders and
 * with `localizedArgs` on the server. All four take exactly one argument, which
 * is not an accident: every other variable part of these sentences was moved into
 * the key precisely so that it could be translated.
 */
export const PUSH_ARG_ORDER = {
  'order.status_changed': ['orderNumber'],
  'order.upcoming': ['orderNumber'],
  'rental.ending_soon': ['orderNumber'],
  'contract.awaiting_signature': ['contractNumber'],
} as const satisfies Record<PushableNotificationType, readonly string[]>;

/** The thresholds `notifications/sweep.ts` fires at. Change one, change both. */
const ENDING_SOON_DAYS = [7, 3, 1] as const;
const UPCOMING_DAYS = 2;

type Copy = Record<LanguageCode, string>;

/**
 * Push-only bodies for the two date-bearing events.
 *
 * The feed says "ends on 24/09/2026", which is right on a screen where the reader
 * has the order in front of them. A lock screen has no such context and no
 * formatter, so these say it in words instead — and because the sweep only ever
 * fires at fixed thresholds, each threshold gets its own sentence and the plural
 * problem never arises.
 */
const ENDING_SOON_BODY: Record<(typeof ENDING_SOON_DAYS)[number], Copy> = {
  7: {
    it: 'Il noleggio dell’ordine {0} termina tra una settimana.',
    en: 'The rental on order {0} ends in a week.',
    fr: 'La location de la commande {0} se termine dans une semaine.',
    de: 'Die Miete zu Bestellung {0} endet in einer Woche.',
  },
  3: {
    it: 'Il noleggio dell’ordine {0} termina tra tre giorni.',
    en: 'The rental on order {0} ends in three days.',
    fr: 'La location de la commande {0} se termine dans trois jours.',
    de: 'Die Miete zu Bestellung {0} endet in drei Tagen.',
  },
  1: {
    it: 'Il noleggio dell’ordine {0} termina domani.',
    en: 'The rental on order {0} ends tomorrow.',
    fr: 'La location de la commande {0} se termine demain.',
    de: 'Die Miete zu Bestellung {0} endet morgen.',
  },
};

const UPCOMING_BODY: Copy = {
  it: 'Il noleggio dell’ordine {0} inizia dopodomani.',
  en: 'The rental on order {0} starts the day after tomorrow.',
  fr: 'La location de la commande {0} commence après-demain.',
  de: 'Die Miete zu Bestellung {0} beginnt übermorgen.',
};

/** One generated string pair. `{0}` is the first positional argument. */
export interface PushStringEntry {
  key: string;
  title: Copy;
  body: Copy;
}

function labelCopy(name: string): Copy {
  const entry = NOTIFICATION_LABELS[name as keyof typeof NOTIFICATION_LABELS] as
    Partial<Copy> | undefined;
  const copy = {} as Copy;
  for (const code of LANGUAGE_CODES) copy[code] = entry?.[code] ?? entry?.en ?? name;
  return copy;
}

/**
 * `'In attesa'` → `'in attesa'`, `'Bezahlt'` → `'bezahlt'`.
 *
 * The status catalogs are written for standalone display — a pill on the order
 * page, a column in the back office — so every label is capitalised. Spliced into
 * "Il tuo ordine X è ora …" that produces a capital letter in the middle of a
 * sentence, in all four languages at once.
 *
 * Only the first character, and through the language's own casing rules: Turkish
 * dotted I is the standard counter-example and `toLowerCase()` gets it wrong. The
 * rest of the label is untouched, so a status that ever contains a proper noun
 * keeps it.
 */
function lowerFirst(value: string, code: LanguageCode): string {
  const tag = languageOf(code).tag;
  return value.charAt(0).toLocaleLowerCase(tag) + value.slice(1);
}

function fill(template: Copy, values: Partial<Record<string, Copy | string>>): Copy {
  const filled = {} as Copy;
  for (const code of LANGUAGE_CODES) {
    filled[code] = template[code].replace(/\{(\w+)\}/g, (whole, name: string) => {
      const value = values[name];
      if (value === undefined) return whole;
      return typeof value === 'string' ? value : value[code];
    });
  }
  return filled;
}

/**
 * Every key the app must define, with its copy. The generator's only input.
 *
 * Built rather than hand-listed, so the ten status variants cannot fall out of
 * step with the enum they come from: append a payment status and its four
 * sentences appear here on the next generate.
 */
/** A standalone label, recased for the middle of a sentence in every language. */
function inSentence(label: Copy): Copy {
  const recased = {} as Copy;
  for (const code of LANGUAGE_CODES) recased[code] = lowerFirst(label[code], code);
  return recased;
}

export function pushStringEntries(): PushStringEntry[] {
  const entries: PushStringEntry[] = [];

  const statusTitle = labelCopy('order.status_changed.title');
  const statusBody = labelCopy('order.status_changed.body');

  for (const [field, catalog] of [
    ['status', ORDER_STATUS],
    ['payment_status', PAYMENT_STATUS],
  ] as const) {
    for (const [code, label] of Object.entries(catalog)) {
      entries.push({
        key: `order_status_changed_${field}_${code}`,
        title: statusTitle,
        /* The status is substituted as TEXT, per language, and the order number
           becomes the positional slot. That split is the whole idea. */
        body: fill(statusBody, {
          orderNumber: '{0}',
          to: inSentence(label as unknown as Copy),
        }),
      });
    }
  }

  for (const days of ENDING_SOON_DAYS) {
    entries.push({
      key: `rental_ending_soon_${days}d`,
      title: labelCopy('rental.ending_soon.title'),
      body: ENDING_SOON_BODY[days],
    });
  }

  entries.push({
    key: `order_upcoming_${UPCOMING_DAYS}d`,
    title: labelCopy('order.upcoming.title'),
    body: UPCOMING_BODY,
  });

  entries.push({
    key: 'contract_awaiting_signature',
    title: labelCopy('contract.awaiting_signature.title'),
    body: fill(labelCopy('contract.awaiting_signature.body'), { contractNumber: '{0}' }),
  });

  return entries;
}

/** Every key that exists, so the server can refuse to send one that does not. */
const KNOWN_KEYS = new Set(pushStringEntries().map((entry) => entry.key));

/**
 * The base key for one row, or `null` when this row has no phone-ready wording.
 *
 * `null` is not a failure — it is the instruction to fall back to a
 * server-rendered sentence, which is what happens for an event that is not
 * pushable, and for a status variant nobody has written copy for yet. Returning a
 * key we have not generated would put the raw key on somebody's lock screen,
 * which is the one outcome worth engineering around.
 */
export function pushStringKey(type: NotificationType, data: NotificationData): string | null {
  const payload = data as Record<string, unknown>;

  const key = (() => {
    if (type === 'order.status_changed') {
      const field = payload.field === 'paymentStatus' ? 'payment_status' : 'status';
      return `order_status_changed_${field}_${String(payload.to)}`;
    }
    if (type === 'rental.ending_soon') return `rental_ending_soon_${String(payload.daysLeft)}d`;
    if (type === 'order.upcoming') return `order_upcoming_${String(payload.daysUntil)}d`;
    if (type === 'contract.awaiting_signature') return 'contract_awaiting_signature';
    return null;
  })();

  if (key === null) return null;
  return KNOWN_KEYS.has(key) ? key : null;
}

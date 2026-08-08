/**
 * Pure parsers for the shapes WordPress stores. No IO, no database — so each
 * one is checkable against a real value from the dump in isolation.
 *
 * Format notes live in docs/code/wp-migration.md.
 */

// --- PHP serialize ----------------------------------------------------------

export type PhpValue = string | number | boolean | null | PhpValue[] | { [key: string]: PhpValue };

/**
 * Minimal `unserialize()` for the subset WooCommerce writes into postmeta:
 * arrays, strings, ints, floats, booleans and null. Objects (`O:`) never
 * appear in the meta this migration reads, so they throw rather than being
 * half-supported.
 *
 * Parsed over a Buffer with byte offsets, not a JS string, because `s:N:"…"`
 * counts N in **bytes**. Italian meta is full of `à`, `°` and `€`, each of
 * which is 2–3 bytes — a character-indexed parser desynchronises on the first
 * accent and produces silent garbage from there on.
 */
export function phpUnserialize(input: string): PhpValue {
  const buffer = Buffer.from(input, 'utf8');
  let offset = 0;

  const fail = (message: string): never => {
    throw new Error(`${message} at byte ${offset}`);
  };

  /** Reads up to `stop`, returning the raw ASCII in between. */
  const readUntil = (stop: string): string => {
    const index = buffer.indexOf(stop, offset);
    if (index < 0) fail(`Expected "${stop}"`);
    const text = buffer.toString('latin1', offset, index);
    offset = index + 1;
    return text;
  };

  const expect = (char: string): void => {
    if (buffer.toString('latin1', offset, offset + 1) !== char) fail(`Expected "${char}"`);
    offset += 1;
  };

  function value(): PhpValue {
    const kind = buffer.toString('latin1', offset, offset + 1);

    if (kind === 'N') {
      offset += 2; // "N;"
      return null;
    }

    offset += 2; // the type char and its ":"

    switch (kind) {
      case 'b':
        return readUntil(';') === '1';
      case 'i':
        return Number.parseInt(readUntil(';'), 10);
      case 'd': {
        const raw = readUntil(';');
        // PHP writes INF/NAN literally; neither is a value this migration wants.
        return Number.isFinite(Number(raw)) ? Number(raw) : 0;
      }
      case 's': {
        const length = Number.parseInt(readUntil(':'), 10);
        expect('"');
        const text = buffer.toString('utf8', offset, offset + length);
        offset += length;
        expect('"');
        expect(';');
        return text;
      }
      case 'a': {
        const count = Number.parseInt(readUntil(':'), 10);
        expect('{');
        const out: Record<string, PhpValue> = {};
        let sequential = true;
        for (let i = 0; i < count; i++) {
          const key = value();
          if (key !== i) sequential = false;
          out[String(key)] = value();
        }
        expect('}');
        // PHP has one array type; a 0..n-1 integer-keyed one is a JS array.
        return sequential ? Object.values(out) : out;
      }
      default:
        return fail(`Unsupported type "${kind}"`);
    }
  }

  return value();
}

/** `phpUnserialize` that returns null instead of throwing — meta is often junk. */
export function tryPhpUnserialize(input: string | null | undefined): PhpValue | null {
  if (!input) return null;
  try {
    return phpUnserialize(input);
  } catch {
    return null;
  }
}

// --- money ------------------------------------------------------------------

/**
 * A WooCommerce `_price` meta value → the project's `"0.00"` money string.
 * Accepts both separators: the dump holds `"1690"`, `"35.0000"` and, in ACF
 * fields typed by hand, `"1,11"`.
 */
export function toMoney(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const text = String(raw).trim().replace(/\s/g, '');
  // Only treat a comma as the decimal point; WooCommerce never writes
  // thousands separators into meta.
  const normalized = text.replace(',', '.');
  const match = /^-?\d+(?:\.\d+)?$/.exec(normalized);
  if (!match) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value.toFixed(2);
}

/**
 * The ACF "a partire da" field: `"1,11€ al giorno"`, `"12€ al giorno"`,
 * `"5,80€ al giorno "`. Returns null for the six junk values (`"469€ "`,
 * `"1690€"`, `"680"`) — those carry no unit, so they are a total someone
 * pasted, not a daily rate, and the report flags them for review rather than
 * inventing a number.
 */
export function parseDailyRate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!/al\s*giorno|all'\s*ora|\ball['’]?ora\b/i.test(text)) return null;
  const match = /(\d+(?:[.,]\d+)?)/.exec(text);
  return match ? toMoney(match[1]!) : null;
}

/**
 * Variation labels carry their own price: `"Conf. 4 pz 5cm x 5cm - 8€"`,
 * `"Carrozzina + doppia batteria - 2640 €"`.
 *
 * This is more trustworthy than the variation's `_price` whenever a product has
 * two variation axes: there, `_price` is the *combined* total of the duration
 * tier and the option, so subtracting a base from it yields a number that means
 * nothing. The label states what the option itself costs.
 */
export function parsePriceFromLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  // Last number before a euro sign — labels put the price at the end.
  const matches = [...label.matchAll(/(\d+(?:[.,]\d+)?)\s*€/g)];
  const last = matches.at(-1);
  return last ? toMoney(last[1]!) : null;
}

/** `"Conf. 4 pz 5cm x 5cm - 8€"` → `"Conf. 4 pz 5cm x 5cm"`. */
export function stripTrailingPrice(label: string): string {
  return label.replace(/\s*[-–—]?\s*\d+(?:[.,]\d+)?\s*€\s*$/, '').trim() || label;
}

// --- rental duration tiers --------------------------------------------------

export interface ParsedDuration {
  duration: number;
  unit: 'hour' | 'day';
}

const DURATION_RE = /^\s*(\d+)\s*(giorni|giorno|gg|ore|ora|h)\b/i;

/**
 * `"15 giorni 120 €"` → `{ duration: 15, unit: 'day' }`.
 *
 * Only the duration is read. The price comes from the variation's own `_price`
 * meta, which is authoritative — the number embedded in the label is
 * decorative and inconsistently formatted (`"100€"`, `"100 €"`, `"- 100 €"`).
 *
 * Returns null when the label is not a duration at all, which is exactly how
 * a real product option (`"Doppia batteria - 320€"`) is told apart from a
 * rental tier without maintaining a list of attribute names.
 */
export function parseDuration(label: string | null | undefined): ParsedDuration | null {
  if (!label) return null;
  const match = DURATION_RE.exec(label);
  if (!match) return null;
  const duration = Number.parseInt(match[1]!, 10);
  if (!Number.isInteger(duration) || duration < 1 || duration > 3650) return null;
  const unit = /^(ore|ora|h)$/i.test(match[2]!) ? 'hour' : 'day';
  return { duration, unit };
}

// --- text -------------------------------------------------------------------

/**
 * Gutenberg stores block metadata in HTML comments around real markup. The
 * markup is worth keeping; the comments are not — they carry editor state that
 * means nothing outside WordPress.
 *
 * Deliberately not a sanitiser. This content is authored by the site owner and
 * lands in a column the admin can edit; escaping it here would only mangle
 * their markup.
 */
export function cleanBlockHtml(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    // `<!-- wp:paragraph -->`, `<!-- /wp:paragraph -->`, and self-closing
    // block comments carrying JSON attributes.
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '')
    // WordPress writes literal "\n" escapes into post_content.
    .replaceAll('\\n', '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || null;
}

/** Block HTML → plain text, for excerpts and meta descriptions. */
export function htmlToText(raw: string | null | undefined): string | null {
  const html = cleanBlockHtml(raw);
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&#8217;', '’')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

/** Cuts to a whole word, so a meta description never ends mid-syllable. */
export function truncate(text: string | null, max: number): string | null {
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Matches `SlugSchema` / `KeySchema`: lowercase, `a-z0-9` and single hyphens.
 * Italian accents fold to ASCII rather than being dropped, so `mobilità`
 * becomes `mobilita` and not `mobilit`.
 */
export function slugify(raw: string, fallback = 'voce'): string {
  const slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110)
    .replace(/-+$/g, '');
  return slug || fallback;
}

/**
 * `SkuFragmentSchema`: A–Z, 0–9 and single hyphens, uppercase, no hyphen at
 * either end.
 *
 * `maxLength` is applied here rather than by the caller, because slicing after
 * the fact is what produces a trailing hyphen — and the schema rejects it.
 */
export function skuFragment(raw: string, fallback = 'MIA', maxLength = 64): string {
  const fragment = slugify(raw, '')
    .toUpperCase()
    .replace(/-+/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
  return fragment || fallback;
}

/**
 * Keeps a derived identifier unique inside one namespace by appending `-2`,
 * `-3`… Used for slugs, base SKUs and category codes, all of which carry a
 * unique index the loader would otherwise trip over.
 */
export function uniquify(candidate: string, taken: Set<string>): string {
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }
  for (let n = 2; ; n++) {
    const next = `${candidate}-${n}`;
    if (!taken.has(next)) {
      taken.add(next);
      return next;
    }
  }
}

import { sql } from 'drizzle-orm';
import {
  bigserial,
  char,
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { deliveryZoneLevel, deliveryZoneValue } from './enums.ts';

/**
 * Delivery pricing: an imported map of Italy, plus the owner's price tree over
 * it.
 *
 * The design and the reasoning behind it are in docs/code/delivery-pricing.md.
 * The three things worth knowing before touching this file:
 *
 * 1. `istat_comuni` and `istat_comune_caps` are IMPORTED, read-only reference
 *    data. Nothing in the app writes them; `script/build-istat-dataset.ts`
 *    produces the CSVs and the seed loads them.
 *
 * 2. Pricing keys on the ISTAT code, never on a name. Names get renamed, collide
 *    across provinces ("Castelnuovo"), and differ between address providers.
 *
 * 3. A CAP is not a level of Italian geography, so `delivery_zones.code` on a
 *    `cap` row holds the CAP alone and its comune comes from `parent_id`. That is
 *    what stops CAP 00060 — shared by 17 comuni across the Tiber valley north of
 *    Rome, which the owner may well price differently — from leaking one comune's
 *    fee onto its neighbours. 18% of Italian CAPs are shared this way.
 */

/* ------------------------------------------------------------- reference --- */

/**
 * The two tiers above the comune, as names.
 *
 * ISTAT publishes no separate file for either: both are repeated on every comune
 * row, so the importer collects them while it walks that file. 20 and 107 rows,
 * and they exist for one reason — a cascading picker has to show `Lazio` and
 * `Roma`, not `12` and `RM`.
 *
 * They are LABELS, not the hierarchy. `istat_comuni` still carries its own
 * `region_code` and `province_code`, which is what everything joins on, so these
 * tables can be reloaded or renamed without touching a single price.
 */
export const istatRegions = pgTable('istat_regions', {
  /** Two digits, e.g. `12` for Lazio. */
  regionCode: char({ length: 2 }).primaryKey(),
  /** Bilingual where ISTAT says so: `Valle d'Aosta/Vallée d'Aoste`. */
  name: text().notNull(),
});

export const istatProvinces = pgTable(
  'istat_provinces',
  {
    /** The two letters that appear in an address: `RM`, `FI`. */
    provinceCode: char({ length: 2 }).primaryKey(),
    name: text().notNull(),
    regionCode: char({ length: 2 })
      .notNull()
      .references(() => istatRegions.regionCode, { onDelete: 'cascade' }),
  },
  (t) => [index('istat_provinces_region_idx').on(t.regionCode)],
);

/**
 * The ISTAT comune list: ~7,894 rows, refreshed maybe yearly.
 *
 * Province and region are plain columns rather than foreign keys to the two
 * tables above, because that is how ISTAT publishes them and nothing here needs a
 * province row to exist on its own — the price tree carries its own province
 * nodes, keyed by these codes.
 */
export const istatComuni = pgTable(
  'istat_comuni',
  {
    /** Six digits, e.g. `058091`. Retired on a merge, never reassigned. */
    istatCode: char({ length: 6 }).primaryKey(),
    /** The official ISTAT denomination, which may be bilingual ("Bolzano/Bozen"). */
    name: text().notNull(),
    /**
     * Case-folded, accent-stripped, punctuation-collapsed. The ONLY column a
     * provider's comune string is ever compared against, and only to break a
     * shared-CAP tie — see the delivery service's `resolveQuote`.
     */
    nameNormalised: text().notNull(),
    /** Two letters as they appear in an address: `RM`, `FI`. */
    provinceCode: char({ length: 2 }).notNull(),
    regionCode: char({ length: 2 }).notNull(),
  },
  (t) => [
    index('istat_comuni_name_normalised_idx').on(t.nameNormalised),
    index('istat_comuni_province_idx').on(t.provinceCode),
  ],
);

/**
 * Which CAPs belong to which comune — a junction, because the relationship is
 * many-to-many in both directions.
 *
 * This table is the resolver, not a convenience: the customer types a CAP and
 * this is what turns it into an ISTAT code without reading any name.
 */
export const istatComuneCaps = pgTable(
  'istat_comune_caps',
  {
    istatCode: char({ length: 6 })
      .notNull()
      .references(() => istatComuni.istatCode, { onDelete: 'cascade' }),
    cap: char({ length: 5 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.istatCode, t.cap] }),
    index('istat_comune_caps_cap_idx').on(t.cap),
  ],
);

/* ----------------------------------------------------------- price tree --- */

/**
 * One row per priced area. `parent_id` is the only thing making this a tree.
 *
 * Legal nesting is country → region → province → comune → cap, and it is the
 * database that refuses anything else: a composite foreign key on
 * `(parent_id, parent_level)` forces the denormalised `parent_level` to equal the
 * parent's real `level`, and a CHECK then whitelists the legal pairs. That is why
 * `parent_level` exists at all — a plain CHECK cannot see another row, and the
 * only alternative is a trigger.
 *
 * Exactly one row has `parent_id IS NULL`, and it is the `country` row. It always
 * carries a value, which is what makes coverage total: the cascade can always
 * fall back to it, so every Italian address gets a fee or a phone quote and never
 * an error. Deleting it would cascade the whole tree away, so the service layer
 * refuses — this repo keeps every migration Drizzle-generated, and a delete guard
 * is the one rule that would need a hand-written trigger to live down here.
 */
export const deliveryZones = pgTable(
  'delivery_zones',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** No single-column FK: the composite one below already covers it. */
    parentId: uuid(),
    /** Mirrors the parent's `level`, provably — see the composite FK below. */
    parentLevel: deliveryZoneLevel(),
    level: deliveryZoneLevel().notNull(),
    /**
     * The identity this row matches on, and the only field pricing reads:
     * region → ISTAT region code, province → `RM`, comune → ISTAT code,
     * cap → the CAP alone, country → `IT`.
     */
    code: text().notNull(),
    /** Display only. Renaming must never change what an address matches. */
    name: text().notNull(),
    /** NULL means inherit. See `delivery_zone_value` in enums.ts. */
    valueKind: deliveryZoneValue(),
    /** Set if and only if `valueKind = 'fee'`, enforced by CHECK. */
    fee: numeric({ precision: 12, scale: 2 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    /* Deleting a zone takes its subtree with it — the tree is the pricing, and a
       province row with no owner would answer for addresses nobody priced. */
    foreignKey({
      name: 'delivery_zones_parent_fk',
      columns: [t.parentId, t.parentLevel],
      foreignColumns: [t.id, t.level],
    }).onDelete('cascade'),
    /* FK target for the above. `unique`, not `uniqueIndex`: PostgreSQL wants a
       real constraint on the referenced columns. */
    unique('delivery_zones_id_level_key').on(t.id, t.level),
    /* No duplicate siblings — while still allowing the same CAP under different
       comuni, which is the whole point of scoping identity to the parent. */
    uniqueIndex('delivery_zones_sibling_key').on(t.parentId, t.level, t.code),
    /* One root, ever. The sibling key cannot say this: unique indexes treat NULL
       parents as all distinct, so without this two `country` rows would fit. */
    uniqueIndex('delivery_zones_root_key')
      .on(t.level)
      .where(sql`${t.parentId} IS NULL`),
    index('delivery_zones_parent_idx').on(t.parentId),
    /* The cascade looks rows up by (level, code) on every quote. */
    index('delivery_zones_level_code_idx').on(t.level, t.code),
    /**
     * Two rules in one, because they guard the same two columns.
     *
     * The first clause plugs the composite FK's MATCH SIMPLE hole: that FK is
     * trivially satisfied when EITHER referencing column is NULL, so a row could
     * name a real parent, leave `parent_level` NULL and never be checked against
     * it. The pair has to be all-or-nothing.
     *
     * The second makes the root the country row and the country row the root.
     */
    check(
      'delivery_zones_root_is_country_check',
      sql`(${t.parentId} IS NULL) = (${t.parentLevel} IS NULL)
        AND (${t.parentId} IS NULL) = (${t.level} = 'country')`,
    ),
    /**
     * The legal nesting, whitelisted. `frazione` is listed but nothing writes it
     * yet — see `delivery_zone_level` in enums.ts.
     */
    check(
      'delivery_zones_nesting_check',
      sql`${t.parentLevel} IS NULL OR (${t.parentLevel}, ${t.level}) IN (
        ('country', 'region'),
        ('region', 'province'),
        ('province', 'comune'),
        ('comune', 'cap'),
        ('comune', 'frazione'),
        ('cap', 'frazione')
      )`,
    ),
    /**
     * The three legal value states, and only those. Written with IS NOT DISTINCT
     * FROM because `value_kind = 'fee'` is NULL for an inheriting row, and a CHECK
     * passes on NULL — which would let an inheriting row keep a stale amount.
     */
    check(
      'delivery_zones_value_check',
      sql`(${t.valueKind} IS NOT DISTINCT FROM 'fee') = (${t.fee} IS NOT NULL)`,
    ),
    check('delivery_zones_fee_sign_check', sql`${t.fee} IS NULL OR ${t.fee} >= 0`),
  ],
);

/**
 * Every address the cascade could not resolve at full precision.
 *
 * Not a log for its own sake: an unresolved comune name silently produces a
 * COARSER price, which nobody notices. This is the only way a real gap becomes
 * visible, and the recurring rows are the aliases worth adding.
 */
export const zoneResolutionMisses = pgTable(
  'zone_resolution_misses',
  {
    id: bigserial({ mode: 'number' }).primaryKey(),
    cap: char({ length: 5 }),
    /** What the provider or the customer gave us, unmodified. */
    providerName: text(),
    provinceCode: char({ length: 2 }),
    /** Which tier ended up answering: `province`, `region`, `country`. */
    resolvedVia: text(),
    seenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('zone_resolution_misses_seen_at_idx').on(t.seenAt)],
);

/**
 * Italy's administrative ladder, read from the committed ISTAT reference data.
 *
 *   regione (20) → provincia (107) → comune (7,896) → CAP
 *
 * One query per tier, each keyed on the tier above. No provider, no key, no
 * network: this is the same data `resolveQuote` prices against, so a CAP picked
 * through this ladder is a CAP the price tree can always answer for — which is the
 * one thing a typed address cannot promise.
 *
 * The CAP is NOT a tier. It hangs off the comune: 7,338 comuni have exactly one
 * (picking the comune settles it), 30 have more than five, and Rome alone has 79.
 * That asymmetry is the whole reason the price tree keys on the comune with the
 * CAP as an optional child — see docs/code/delivery-pricing.md.
 */

import type { Database } from '@mia/db';
import { asc, eq } from '@mia/db';
import { istatComuneCaps, istatComuni, istatProvinces, istatRegions } from '@mia/db/schema';

export interface RegionDto {
  code: string;
  name: string;
}

export interface ProvinceDto {
  code: string;
  name: string;
  regionCode: string;
}

export interface ComuneDto {
  istatCode: string;
  name: string;
  provinceCode: string;
  /** Every CAP this comune has. One for 93% of Italy; 79 for Rome. */
  caps: string[];
}

export function listRegions(db: Database): Promise<RegionDto[]> {
  return db
    .select({ code: istatRegions.regionCode, name: istatRegions.name })
    .from(istatRegions)
    .orderBy(asc(istatRegions.name));
}

export function listProvinces(db: Database, regionCode: string): Promise<ProvinceDto[]> {
  return db
    .select({
      code: istatProvinces.provinceCode,
      name: istatProvinces.name,
      regionCode: istatProvinces.regionCode,
    })
    .from(istatProvinces)
    .where(eq(istatProvinces.regionCode, regionCode))
    .orderBy(asc(istatProvinces.name));
}

/**
 * The comuni of one province, each with its CAPs.
 *
 * Two queries and a join in memory rather than one query with an aggregate: the
 * largest province is ~320 comuni, and this keeps the CAP list an array of strings
 * instead of something the driver has to unpack from `string_agg`.
 */
export async function listComuni(db: Database, provinceCode: string): Promise<ComuneDto[]> {
  const comuni = await db
    .select({
      istatCode: istatComuni.istatCode,
      name: istatComuni.name,
      provinceCode: istatComuni.provinceCode,
    })
    .from(istatComuni)
    .where(eq(istatComuni.provinceCode, provinceCode))
    .orderBy(asc(istatComuni.name));

  if (comuni.length === 0) return [];

  const pairs = await db
    .select({ istatCode: istatComuneCaps.istatCode, cap: istatComuneCaps.cap })
    .from(istatComuneCaps)
    .innerJoin(istatComuni, eq(istatComuni.istatCode, istatComuneCaps.istatCode))
    .where(eq(istatComuni.provinceCode, provinceCode))
    .orderBy(asc(istatComuneCaps.cap));

  const capsByComune = new Map<string, string[]>();
  for (const pair of pairs) {
    const list = capsByComune.get(pair.istatCode);
    if (list) list.push(pair.cap);
    else capsByComune.set(pair.istatCode, [pair.cap]);
  }

  /* Two comuni in Italy have no CAP at all in the source data — Montecopiolo and
     San Basilio, both of which changed province recently. An empty array is the
     honest answer; the checkout falls back to a typed CAP, and the quote falls
     back to the province. */
  return comuni.map((comune) => ({ ...comune, caps: capsByComune.get(comune.istatCode) ?? [] }));
}

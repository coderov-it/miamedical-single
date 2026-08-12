import type { Database } from '@mia/db';
import { and, asc, eq } from '@mia/db';
import { deliveryZones, istatComuneCaps, istatComuni, zoneResolutionMisses } from '@mia/db/schema';

import type { ComuneRow, ZoneLevel, ZoneRow, ZoneValueKind } from './types.ts';

export interface ZoneInsert {
  parentId: string | null;
  parentLevel: ZoneLevel | null;
  level: ZoneLevel;
  code: string;
  name: string;
  valueKind: ZoneValueKind | null;
  fee: string | null;
}

export interface ZoneUpdate {
  code?: string;
  name?: string;
  valueKind?: ZoneValueKind | null;
  fee?: string | null;
}

/**
 * Every zone, in one query.
 *
 * The whole table is loaded for a quote as well as for the admin, and that is the
 * design rather than a shortcut: inheritance means the table stays in the tens or
 * low hundreds of rows — Italy has ~7,900 comuni but the point of the tree is that
 * you never enter them. If it ever grows past a few thousand, cache it; do not
 * start hand-writing recursive CTEs against a table this small.
 */
export async function findAllZones(db: Database): Promise<ZoneRow[]> {
  return db.select().from(deliveryZones).orderBy(asc(deliveryZones.level), asc(deliveryZones.name));
}

export async function findZoneById(db: Database, id: string): Promise<ZoneRow | undefined> {
  const [row] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id)).limit(1);
  return row;
}

/** The one row with no parent. Always exists — the seed creates it. */
export async function findCountryZone(db: Database): Promise<ZoneRow | undefined> {
  const [row] = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.level, 'country'))
    .limit(1);
  return row;
}

/** A sibling already using this identity, which the unique index would reject. */
export async function findSibling(
  db: Database,
  parentId: string | null,
  level: ZoneLevel,
  code: string,
  excludeId?: string,
): Promise<ZoneRow | undefined> {
  const rows = await db
    .select()
    .from(deliveryZones)
    .where(and(eq(deliveryZones.level, level), eq(deliveryZones.code, code)));
  return rows.find((row) => row.parentId === parentId && row.id !== excludeId);
}

export async function insertZone(db: Database, data: ZoneInsert): Promise<ZoneRow> {
  const [row] = await db.insert(deliveryZones).values(data).returning();
  if (!row) throw new Error('Insert returned no delivery zone row.');
  return row;
}

export async function updateZone(
  db: Database,
  id: string,
  data: ZoneUpdate,
): Promise<ZoneRow | undefined> {
  const [row] = await db
    .update(deliveryZones)
    .set(data)
    .where(eq(deliveryZones.id, id))
    .returning();
  return row;
}

/** Cascades to the whole subtree — the foreign key says so, not this function. */
export async function deleteZone(db: Database, id: string): Promise<void> {
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
}

/**
 * Every comune a CAP could mean. 18% of Italian CAPs return more than one row, and
 * `24060` returns 45 — this is the fact the whole resolver is shaped around.
 */
/**
 * One comune by its ISTAT code — what the checkout's cascading picker sends.
 *
 * Exact, and the reason the shared-CAP tiebreak never has to run for an address
 * the customer picked rather than typed.
 */
export async function findComuneByIstatCode(
  db: Database,
  istatCode: string,
): Promise<ComuneRow | undefined> {
  const [row] = await db
    .select({
      istatCode: istatComuni.istatCode,
      name: istatComuni.name,
      nameNormalised: istatComuni.nameNormalised,
      provinceCode: istatComuni.provinceCode,
      regionCode: istatComuni.regionCode,
    })
    .from(istatComuni)
    .where(eq(istatComuni.istatCode, istatCode))
    .limit(1);
  return row;
}

export async function findComuniByCap(db: Database, cap: string): Promise<ComuneRow[]> {
  return db
    .select({
      istatCode: istatComuni.istatCode,
      name: istatComuni.name,
      nameNormalised: istatComuni.nameNormalised,
      provinceCode: istatComuni.provinceCode,
      regionCode: istatComuni.regionCode,
    })
    .from(istatComuneCaps)
    .innerJoin(istatComuni, eq(istatComuni.istatCode, istatComuneCaps.istatCode))
    .where(eq(istatComuneCaps.cap, cap))
    .orderBy(asc(istatComuni.name));
}

/**
 * Records an address we could not price precisely.
 *
 * Fire-and-forget on purpose: a customer must never see a checkout fail because a
 * diagnostic insert did. The caller does not await it.
 */
export function logResolutionMiss(
  db: Database,
  data: {
    cap: string | null;
    providerName: string | null;
    provinceCode: string | null;
    resolvedVia: string | null;
  },
): void {
  void db
    .insert(zoneResolutionMisses)
    .values(data)
    .catch(() => {
      // Nothing to do about it here, and nothing depends on it.
    });
}

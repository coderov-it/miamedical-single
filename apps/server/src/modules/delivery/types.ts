import type { deliveryZones, istatComuni } from '@mia/db/schema';

export type ZoneRow = typeof deliveryZones.$inferSelect;
export type ZoneLevel = ZoneRow['level'];
export type ZoneValueKind = NonNullable<ZoneRow['valueKind']>;

export type ComuneRow = typeof istatComuni.$inferSelect;

/**
 * One comune a CAP could mean, with the path the resolver walked for it.
 *
 * The path is kept, not just the answer, because a shared CAP is settled by
 * comparing paths: when candidates disagree the answer is the deepest row they all
 * have in common. See `resolveQuote`.
 */
export interface ZoneCandidate {
  comune: ComuneRow;
  /** Country row first, then whichever of region → province → comune → cap exist. */
  path: ZoneRow[];
  /** The deepest row in `path` that carries a value, or null if none does. */
  answer: ZoneRow | null;
}

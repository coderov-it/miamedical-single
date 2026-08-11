import * as v from 'valibot';

import { MoneySchema, UuidSchema } from './common.ts';

/**
 * Delivery-zone input.
 *
 * The nesting rules and the three value states are enforced in the database too
 * (see `packages/db/src/schema/delivery.ts`) — these schemas exist so a bad
 * request comes back as a field error instead of a constraint violation, not as
 * the only line of defence.
 */

/** Mirrors the `delivery_zone_level` enum, widest first. */
export const ZoneLevelSchema = v.picklist([
  'country',
  'region',
  'province',
  'comune',
  'cap',
  'frazione',
]);

export type ZoneLevel = v.InferOutput<typeof ZoneLevelSchema>;

/**
 * A zone's `code` is its identity, and each level spells it differently:
 *
 *   country  IT              two letters
 *   region   12              ISTAT region code, two digits
 *   province RM              the two letters an address carries
 *   comune   058091          ISTAT comune code, six digits
 *   cap      00121           five digits
 *   frazione ostia-antica    a slug the operator picks
 *
 * Kept loose here and checked per level in the service, which knows the level the
 * row is actually being created at.
 */
const ZoneCodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'A code is required — without one this area matches nothing.'),
  v.maxLength(64),
);

const ZoneNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'A name is required.'),
  v.maxLength(160),
);

/**
 * The three legal states, as one field pair.
 *
 * `null` means inherit, and it is deliberately different from `'call'`: absent is
 * "nobody has filled this in", `call` is "we serve this area and will not quote it
 * online". Only the second is a decision.
 */
const ZoneValueFields = {
  valueKind: v.optional(v.nullable(v.picklist(['fee', 'call']))),
  fee: v.optional(v.nullable(MoneySchema)),
};

/**
 * `fee` is present exactly when `valueKind` is `'fee'` — the same rule as the
 * `delivery_zones_value_check` constraint. Raised on `fee` so a form can show it
 * against the field the operator was filling in.
 *
 * Written out at both call sites rather than shared: `partialCheck` takes its input
 * type from the pipe it sits in, and hoisting it to a constant widens that to
 * `PartialInput` and stops matching either object.
 */
const VALUE_MESSAGE = 'A fixed fee needs an amount, and only a fixed fee may carry one.';

export const CreateZoneSchema = v.pipe(
  v.strictObject({
    /** `null` only for the country row, which the seed already created. */
    parentId: v.optional(v.nullable(UuidSchema)),
    level: ZoneLevelSchema,
    code: ZoneCodeSchema,
    name: ZoneNameSchema,
    ...ZoneValueFields,
  }),
  v.forward(
    v.partialCheck(
      [['valueKind'], ['fee']],
      (input) => (input.valueKind === 'fee') === (input.fee != null),
      VALUE_MESSAGE,
    ),
    ['fee'],
  ),
);

/**
 * Not `v.partial(CreateZoneSchema)`: a zone never changes level or parent. Moving
 * a row between parents would change what every address under it resolves to,
 * which is a delete-and-recreate decision, not an edit.
 */
export const UpdateZoneSchema = v.pipe(
  v.strictObject({
    code: v.optional(ZoneCodeSchema),
    name: v.optional(ZoneNameSchema),
    ...ZoneValueFields,
  }),
  v.forward(
    v.partialCheck(
      [['valueKind'], ['fee']],
      (input) => (input.valueKind === 'fee') === (input.fee != null),
      VALUE_MESSAGE,
    ),
    ['fee'],
  ),
);

export const ZoneIdParamSchema = v.object({ id: UuidSchema });

/** Five digits, exactly. Leading zeros are significant — `00121` is not `121`. */
export const CapSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^\d{5}$/, 'A CAP is five digits, for example 00121.'),
);

/**
 * What the checkout sends.
 *
 * `comuneName` is optional and only ever breaks a tie: 18% of Italian CAPs are
 * shared by more than one comune, and when an address provider gives us a name we
 * can pick the right one instead of falling back to the province. It is never
 * fuzzy-matched — see the service.
 */
export const QuoteSchema = v.strictObject({
  cap: CapSchema,
  comuneName: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(160)))),
});

export type CreateZoneInput = v.InferOutput<typeof CreateZoneSchema>;
export type UpdateZoneInput = v.InferOutput<typeof UpdateZoneSchema>;
export type QuoteInput = v.InferOutput<typeof QuoteSchema>;

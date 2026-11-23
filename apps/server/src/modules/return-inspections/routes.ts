/** HTTP edge only: validate, delegate to the service, map to DTOs. */

import { P } from '@mia/permissions';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toOrderDetail } from '../orders/mapper.ts';
import { OrderIdParamSchema } from '../orders/validators.ts';
import type { AttentionRecord } from './attention-repo.ts';
import * as service from './service.ts';
import type { UnitDetails } from './unit-details.ts';
import { AttentionIdParamSchema, InspectUnitSchema, ResolveAttentionSchema } from './validators.ts';

/** What both lists print around a unit; dates go out as ISO strings. */
function toUnitDto(row: UnitDetails) {
  return {
    productImage: row.productImage,
    quantity: row.quantity,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerCity: row.customerCity,
    rentalStartDate: row.rentalStartDate,
    rentalEndDate: row.rentalEndDate,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    receivedByName: row.receivedByName,
  };
}

function toAttentionDto(row: AttentionRecord) {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    productId: row.productId,
    productTitle: row.productTitle,
    unitNumber: row.unitNumber,
    note: row.note,
    inspectedAt: row.inspectedAt.toISOString(),
    inspectedByName: row.inspectedByName,
    ...toUnitDto(row),
  };
}

/** Mounted at /api/admin/orders. */
export const returnInspectionOrderRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  POST /api/admin/orders/:id/inspections (order:update)
  Decides one returned unit (restocked | attention); the last unit closes the order. Returns the order detail.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/inspections',
    requirePermission(P.ORDER_UPDATE),
    validate('param', OrderIdParamSchema),
    validate('json', InspectUnitSchema),
    async (c) => {
      const order = await service.inspectUnit(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        c.get('user'),
      );
      return c.json({ data: toOrderDetail(order) });
    },
  );

/** Mounted at /api/admin/returns. */
export const returnsAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/returns/pending (order:read)
  Every returned rental unit not yet decided, oldest received first. Each unit carries
  order, unitNumber/quantity, productTitle/productImage, customer name/email/phone/city,
  rental start/end dates and receivedAt/receivedByName.
  -------------------------------------------------------------------------- **/
  .get('/pending', requirePermission(P.ORDER_READ), async (c) => {
    const units = await service.listPending(c.get('db'));
    return c.json({
      data: units.map((unit) => ({
        orderId: unit.orderId,
        orderNumber: unit.orderNumber,
        orderItemId: unit.orderItemId,
        productTitle: unit.productTitle,
        unitNumber: unit.unitNumber,
        ...toUnitDto(unit),
        receivedAt: unit.receivedAt.toISOString(),
      })),
    });
  });

/** Mounted at /api/admin/attention. */
export const attentionAdminRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/admin/attention (order:read)
  Returned units waiting for a repair decision, oldest first, with the same unit
  details as /returns/pending plus the inspection note, inspectedAt and inspectedByName.
  -------------------------------------------------------------------------- **/
  .get('/', requirePermission(P.ORDER_READ), async (c) => {
    const rows = await service.listAttention(c.get('db'));
    return c.json({ data: rows.map(toAttentionDto) });
  })

  /** --------------------------------------------------------------------------
  POST /api/admin/attention/:id/resolve (order:update)
  Marks a unit repaired (back in stock) or written off; returns the item with its resolution fields.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/resolve',
    requirePermission(P.ORDER_UPDATE),
    validate('param', AttentionIdParamSchema),
    validate('json', ResolveAttentionSchema),
    async (c) => {
      const row = await service.resolveAttention(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json'),
        c.get('user'),
      );
      return c.json({
        data: {
          ...toAttentionDto(row),
          resolution: row.resolution,
          resolutionNote: row.resolutionNote,
          resolvedAt: row.resolvedAt?.toISOString() ?? null,
        },
      });
    },
  );

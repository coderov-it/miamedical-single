import { P } from '@mia/permissions';
import {
  ContractIdParamSchema,
  ContractQuerySchema,
  GenerateContractSchema,
  ManualContractSchema,
  SignContractSchema,
  SigningTokenQuerySchema,
  UuidSchema,
  VoidContractSchema,
} from '@mia/validators';
import * as v from 'valibot';
import { Hono } from 'hono';

import { requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { clientIp } from '../../shared/http/rate-limit.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta } from '../products/mapper.ts';
import { toContractDetail, toContractSummary } from './mapper.ts';
import * as service from './service.ts';

export const contractAdminRoutes = new Hono<AppEnv>()
  .get(
    '/',
    requirePermission(P.CONTRACT_READ),
    validate('query', ContractQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const result = await service.list(c.get('db'), query);
      return c.json({
        data: result.rows.map(toContractSummary),
        meta: toPageMeta(query.page, query.perPage, result.total),
      });
    },
  )

  .get(
    '/by-order/:orderId',
    requirePermission(P.CONTRACT_READ),
    validate('param', v.object({ orderId: UuidSchema })),
    async (c) => {
      const contract = await service.getByOrderId(c.get('db'), c.req.valid('param').orderId);
      return c.json({ data: contract ? toContractSummary(contract) : null });
    },
  )

  .get(
    '/:id',
    requirePermission(P.CONTRACT_READ),
    validate('param', ContractIdParamSchema),
    async (c) => {
      const contract = await service.getById(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toContractDetail(contract) });
    },
  )

  .get(
    '/:id/preview',
    requirePermission(P.CONTRACT_READ),
    validate('param', ContractIdParamSchema),
    async (c) => {
      const html = await service.renderPreview(c.get('db'), c.req.valid('param').id);
      return c.html(html);
    },
  )

  .post(
    '/:id/send',
    requirePermission(P.CONTRACT_UPDATE),
    validate('param', ContractIdParamSchema),
    async (c) => {
      await service.resend(c.get('db'), c.req.valid('param').id);
      const contract = await service.getById(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toContractDetail(contract) });
    },
  )

  .post(
    '/:id/void',
    requirePermission(P.CONTRACT_UPDATE),
    validate('param', ContractIdParamSchema),
    validate('json', VoidContractSchema),
    async (c) => {
      const contract = await service.voidContract(
        c.get('db'),
        c.req.valid('param').id,
        c.req.valid('json').reason,
        c.get('user')!.id,
      );
      return c.json({ data: toContractDetail(contract) });
    },
  )

  .post(
    '/manual',
    requirePermission(P.CONTRACT_CREATE),
    validate('json', ManualContractSchema),
    async (c) => {
      const db = c.get('db');
      const contract = await service.createManual(db, c.req.valid('json'));
      const detail = await service.getById(db, contract.id);
      return c.json({ data: toContractDetail(detail) }, 201);
    },
  )

  .post(
    '/generate',
    requirePermission(P.CONTRACT_CREATE),
    validate('json', GenerateContractSchema),
    async (c) => {
      const { orderId } = c.req.valid('json');
      const db = c.get('db');

      const order = await db.query.orders.findFirst({
        where: (t, { eq }) => eq(t.id, orderId),
        with: { items: true },
      });
      if (!order) throw new Error('Order not found.');

      const items = order.items.map((item) => {
        const config = item.configuration as Record<string, unknown> | null;
        const rental = config?.rental as { startDate: string; endDate: string | null; units: number } | null;
        return {
          productTitle: item.productTitle,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          startDate: rental?.startDate ?? '',
          endDate: rental?.endDate ?? null,
          rentalDays: rental?.units ?? 1,
        };
      });

      const address = order.shippingAddress as Record<string, unknown> | null;
      const addressStr = address
        ? `${address.line1 ?? ''}, ${address.postalCode ?? ''} ${address.city ?? ''}`
        : '';

      const contract = await service.generateForOrder(db, {
        orderId: order.id,
        orderNumber: order.number,
        customerType: (order.customerType ?? 'tourist') as 'private' | 'company' | 'tourist',
        customerName: `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim(),
        email: order.email,
        phone: order.phone ?? '',
        address: addressStr,
        codiceFiscale: order.codiceFiscale,
        partitaIva: order.partitaIva,
        items,
        subtotal: order.subtotal,
        shippingTotal: order.shippingTotal,
        total: order.total,
        currency: order.currency,
        hasDepositProduct: false,
      });

      const detail = await service.getById(db, contract.id);
      return c.json({ data: toContractDetail(detail) }, 201);
    },
  );

export const contractPublicRoutes = new Hono<AppEnv>()
  .get('/sign', validate('query', SigningTokenQuerySchema), async (c) => {
    const { token } = c.req.valid('query');
    const result = await service.loadForSigning(c.get('db'), token);
    return c.json({
      data: {
        contract: toContractDetail(result.contract),
        html: result.html,
      },
    });
  })

  .post('/sign', validate('query', SigningTokenQuerySchema), validate('json', SignContractSchema), async (c) => {
    const { token } = c.req.valid('query');
    const { signatureDataUrl } = c.req.valid('json');
    const contract = await service.sign(
      c.get('db'),
      token,
      signatureDataUrl,
      clientIp(c) ?? 'unknown',
      c.req.header('user-agent') ?? 'unknown',
    );
    return c.json({ data: toContractDetail(contract) });
  });

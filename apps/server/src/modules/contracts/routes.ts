import { P } from '@mia/permissions';
import {
  ContractIdParamSchema,
  ContractQuerySchema,
  GenerateContractSchema,
  ManualContractSchema,
  RentalPeriodInputSchema,
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
  /** --------------------------------------------------------------------------
  GET /api/admin/contracts (contract:read)
  Paged contract list.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  GET /api/admin/contracts/by-order/:orderId (contract:read)
  Every contract an order has accumulated, newest first.
  -------------------------------------------------------------------------- **/
  .get(
    '/by-order/:orderId',
    requirePermission(P.CONTRACT_READ),
    validate('param', v.object({ orderId: UuidSchema })),
    async (c) => {
      // Renewals mean an order's contract history is a list, and the first
      // entry is the live one.
      const contracts = await service.listByOrderId(c.get('db'), c.req.valid('param').orderId);
      return c.json({ data: contracts.map(toContractSummary) });
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/contracts/:id (contract:read)
  One contract with its signing state and history.
  -------------------------------------------------------------------------- **/
  .get(
    '/:id',
    requirePermission(P.CONTRACT_READ),
    validate('param', ContractIdParamSchema),
    async (c) => {
      const contract = await service.getById(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toContractDetail(contract) });
    },
  )

  /** --------------------------------------------------------------------------
  GET /api/admin/contracts/:id/preview (contract:read)
  The contract rendered as HTML, for looking at before it is sent.
  -------------------------------------------------------------------------- **/
  .get(
    '/:id/preview',
    requirePermission(P.CONTRACT_READ),
    validate('param', ContractIdParamSchema),
    async (c) => {
      const html = await service.renderPreview(c.get('db'), c.req.valid('param').id);
      return c.html(html);
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/:id/send (contract:update)
  Re-sends the contract to the customer for signing.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/:id/signing-link (contract:update)
  Mints a signing URL to hand over by phone or in person.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/signing-link',
    /* UPDATE, not READ: minting a token is a write that yields the power to
       execute the contract — the same capability as /send, same permission. */
    requirePermission(P.CONTRACT_UPDATE),
    validate('param', ContractIdParamSchema),
    async (c) => {
      const url = await service.getSigningLink(c.get('db'), c.req.valid('param').id);
      return c.json({ data: { url } });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/:id/update-period (contract:update)
  Moves the rental period and re-sends the contract.
  -------------------------------------------------------------------------- **/
  .post(
    '/:id/update-period',
    requirePermission(P.CONTRACT_UPDATE),
    validate('param', ContractIdParamSchema),
    // The renewal flow's period shape, `to > from` rule included.
    validate('json', RentalPeriodInputSchema),
    async (c) => {
      const { from, to } = c.req.valid('json');
      const contract = await service.updatePeriodAndResend(
        c.get('db'),
        c.req.valid('param').id,
        from,
        to,
      );
      return c.json({ data: toContractDetail(contract) });
    },
  )

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/:id/void (contract:update)
  Voids the contract with a stated reason.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/manual (contract:create)
  Creates a contract from typed details, with no order behind it.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  POST /api/admin/contracts/generate (contract:create)
  Creates a contract from an existing order.
  -------------------------------------------------------------------------- **/
  .post(
    '/generate',
    requirePermission(P.CONTRACT_CREATE),
    validate('json', GenerateContractSchema),
    async (c) => {
      const db = c.get('db');
      const contract = await service.generateFromOrder(db, c.req.valid('json').orderId, {
        actorAdminUserId: c.get('user')?.id ?? null,
      });
      const detail = await service.getById(db, contract.id);
      return c.json({ data: toContractDetail(detail) }, 201);
    },
  );

export const contractPublicRoutes = new Hono<AppEnv>()
  /** --------------------------------------------------------------------------
  GET /api/contracts/sign (public, signing token)
  The contract behind a signing token, rendered for the customer.
  -------------------------------------------------------------------------- **/
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

  /** --------------------------------------------------------------------------
  POST /api/contracts/sign (public, signing token)
  Signs the contract, recording the signature, IP and user agent.
  -------------------------------------------------------------------------- **/
  .post(
    '/sign',
    validate('query', SigningTokenQuerySchema),
    validate('json', SignContractSchema),
    async (c) => {
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
    },
  );

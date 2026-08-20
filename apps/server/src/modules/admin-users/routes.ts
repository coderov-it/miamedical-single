import { P } from '@mia/permissions';
import {
  AdminUserIdParamSchema,
  AdminUserQuerySchema,
  CreateAdminUserSchema,
  SetAdminPasswordSchema,
  SetAdminPermissionsSchema,
  UpdateAdminUserSchema,
} from '@mia/validators';
import { Hono } from 'hono';

import { currentUser, requirePermission } from '../../shared/auth/guards.ts';
import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import { toPageMeta } from '../products/mapper.ts';
import { toAdminUserDto } from './mapper.ts';
import * as service from './service.ts';

/**
 * Administering back-office accounts. Validate, delegate, map — every rule
 * about who may grant what lives in `service.ts`.
 *
 * Note the split between `admin:update` and `admin:permission_assign`: fixing a
 * name and handing out access are different decisions, so they are different
 * grants and different endpoints. The permission catalog itself is not served
 * from here — it is static, shipped in `@mia/permissions`, and the admin UI
 * imports the same module the guards compare against.
 */
export const adminUserRoutes = new Hono<AppEnv>()
  .get('/', requirePermission(P.ADMIN_READ), validate('query', AdminUserQuerySchema), async (c) => {
    const query = c.req.valid('query');
    const result = await service.list(c.get('db'), query);

    return c.json({
      data: result.rows.map(toAdminUserDto),
      meta: toPageMeta(query.page, query.perPage, result.total),
    });
  })

  .post(
    '/',
    // `admin:create` alone is enough to add an operator who holds nothing;
    // the service demands `admin:permission_assign` the moment the body
    // actually grants something.
    requirePermission(P.ADMIN_CREATE),
    validate('json', CreateAdminUserSchema),
    async (c) => {
      const row = await service.create(c.get('db'), currentUser(c), c.req.valid('json'));
      return c.json({ data: toAdminUserDto(row) }, 201);
    },
  )

  .get(
    '/:id',
    requirePermission(P.ADMIN_READ),
    validate('param', AdminUserIdParamSchema),
    async (c) => {
      const row = await service.get(c.get('db'), c.req.valid('param').id);
      return c.json({ data: toAdminUserDto(row) });
    },
  )

  .patch(
    '/:id',
    requirePermission(P.ADMIN_UPDATE),
    validate('param', AdminUserIdParamSchema),
    validate('json', UpdateAdminUserSchema),
    async (c) => {
      const row = await service.updateProfile(
        c.get('db'),
        currentUser(c),
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: toAdminUserDto(row) });
    },
  )

  /**
   * PUT, not PATCH: the body is the account's whole access, so a field the
   * client forgot cannot read as "leave that part alone".
   */
  .put(
    '/:id/permissions',
    requirePermission(P.ADMIN_PERMISSION_ASSIGN),
    validate('param', AdminUserIdParamSchema),
    validate('json', SetAdminPermissionsSchema),
    async (c) => {
      const row = await service.setPermissions(
        c.get('db'),
        currentUser(c),
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: toAdminUserDto(row) });
    },
  )

  .post(
    '/:id/password',
    requirePermission(P.ADMIN_UPDATE),
    validate('param', AdminUserIdParamSchema),
    validate('json', SetAdminPasswordSchema),
    async (c) => {
      await service.setPassword(
        c.get('db'),
        currentUser(c),
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      return c.json({ data: { ok: true } });
    },
  )

  .delete(
    '/:id',
    requirePermission(P.ADMIN_DELETE),
    validate('param', AdminUserIdParamSchema),
    async (c) => {
      await service.remove(c.get('db'), currentUser(c), c.req.valid('param').id);
      return c.json({ data: { deleted: true } });
    },
  );

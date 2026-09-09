/**
 * Shapes for the profile screen — the operator looking at their own account.
 *
 * Served by `GET /api/auth/profile`, which is behind `requireAuth` and nothing
 * more. That is the whole point of the screen: an operator holding no
 * permission at all can still open it, because `/api/admin/users` answers to
 * `admin:*` and refuses a self-target anyway.
 */

import type { InferResponseType } from 'hono/client';

import type { api } from '~/lib/api';

export type Profile = InferResponseType<typeof api.api.auth.profile.$get, 200>['data'];

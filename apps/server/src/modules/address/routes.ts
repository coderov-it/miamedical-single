import { AddressSuggestQuerySchema, ProvinceListQuerySchema, ComuneListQuerySchema } from '@mia/validators';
import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import { validate } from '../../shared/http/validate.ts';
import * as geography from './geography.ts';
import * as service from './service.ts';

/**
 * Public and unauthenticated, like the delivery quote and for the same reason: it
 * is asked while the customer is still typing their first order, long before there
 * is an account.
 *
 * GET, unlike the quote. The quote is asked about a specific customer's address
 * and has no business in a proxy log; this carries a fragment of a street name
 * with no name, no CAP and no order attached to it, and being cacheable by the
 * browser is worth more than hiding "via ostie".
 */
export const addressPublicRoutes = new Hono<AppEnv>()
  .get('/suggest', validate('query', AddressSuggestQuerySchema), async (c) => {
    const { q } = c.req.valid('query');
    const suggestions = await service.suggestAddresses(q);
    /* A minute is long enough that backspacing over a word costs nothing and
       short enough that a new building appears the same day. `private`: this is a
       customer's half-typed address, not something a shared cache should hold. */
    c.header('cache-control', 'private, max-age=60');
    return c.json({ data: suggestions });
  })

  /*
    The administrative ladder. Committed reference data that changes when ISTAT
    publishes, which is roughly yearly — so it is cached hard and publicly, unlike
    `/suggest` above, which carries a customer's own half-typed street.
  */
  .get('/regions', async (c) => {
    c.header('cache-control', 'public, max-age=86400');
    return c.json({ data: await geography.listRegions(c.get('db')) });
  })
  .get('/provinces', validate('query', ProvinceListQuerySchema), async (c) => {
    c.header('cache-control', 'public, max-age=86400');
    const { regionCode } = c.req.valid('query');
    return c.json({ data: await geography.listProvinces(c.get('db'), regionCode) });
  })
  .get('/comuni', validate('query', ComuneListQuerySchema), async (c) => {
    c.header('cache-control', 'public, max-age=86400');
    const { provinceCode } = c.req.valid('query');
    return c.json({ data: await geography.listComuni(c.get('db'), provinceCode) });
  });

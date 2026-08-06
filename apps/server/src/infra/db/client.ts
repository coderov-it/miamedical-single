import { getDatabase } from '@mia/db';

import { env } from '../../config/env.ts';

/**
 * Infrastructure bridge to `@mia/db`. The schema and query builders live in the
 * package; this file only owns the connection for this process.
 */
export const db = getDatabase({ url: env.DATABASE_URL });

export type { Database } from '@mia/db';

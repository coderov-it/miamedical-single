import type { Database } from '@mia/db';

export interface SessionUser {
  id: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
}

/** Shared Hono generics. Every router is typed with this so `c.get()` is safe. */
export interface AppEnv {
  Variables: {
    db: Database;
    requestId: string;
    user: SessionUser | null;
  };
}

import { ChangePasswordSchema, LoginSchema } from '@mia/validators';

/**
 * Login and password contracts are shared with the admin UI, so they live in
 * `@mia/validators`. Re-exported here to keep routes on a single import source.
 */
export { ChangePasswordSchema, LoginSchema };

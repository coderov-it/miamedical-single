/**
 * Attribute-based access control, shared by the server and the admin UI.
 *
 * Permissions are integers. They are stored as `int[]` on `users.permissions`,
 * compared as integers in guards, and only ever rendered as strings for humans.
 * See `catalog.ts` for the numbering rules before adding one.
 */
export * from './catalog.ts';
export * from './check.ts';

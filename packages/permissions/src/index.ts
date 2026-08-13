/**
 * Attribute-based access control, shared by the server and the admin UI.
 *
 * Permissions are integers. They are stored as `int[]` on
 * `admin_users.permissions`, compared as integers in guards, and only ever
 * rendered as strings for humans. There are no roles — see `check.ts` for the
 * single non-code attribute and why it exists, and `catalog.ts` for the numbering
 * rules before adding a permission.
 */
export * from './catalog.ts';
export * from './check.ts';

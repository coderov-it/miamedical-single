/**
 * Every template this platform renders, as plain functions returning strings.
 *
 * It is a package rather than a folder inside the server for one reason: the server is
 * not the only thing that needs a rendered message. A preview page can import these
 * and show exactly what an inbox will get, without a transport, a database, or a copy
 * of the fixtures — see `EMAIL_SAMPLES`.
 *
 * That is also why this package has no dependencies and imports nothing from any app.
 * Adding one would decide, for every consumer, what a template costs to render.
 *
 * The preview fixtures are deliberately NOT re-exported here — they live behind
 * `@mia/templates/samples`. Exporting them from the root put them in the server's
 * bundle, and a running API has no business carrying `elena.moretti@example.it`.
 *
 * `literal/` names the technique: template literals. It is a folder rather than the
 * root so a second technique can land beside it without moving these files — a PDF
 * built from a real layout engine would not belong in here.
 */

export * from './brand.ts';
export * from './contact.ts';
export * from './literal/email/index.ts';
export * from './literal/contract/index.ts';

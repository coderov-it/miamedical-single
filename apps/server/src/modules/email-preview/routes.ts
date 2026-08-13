import { EMAIL_SAMPLES } from '@mia/templates/samples';
import { Hono } from 'hono';

import type { AppEnv } from '../../shared/http/context.ts';
import { previewPage } from './page.ts';

/**
 * Renders every email against its fixtures, for looking at.
 *
 * **Mounted only outside production** — see the guard in `app.ts`. It reads nothing,
 * writes nothing and needs no session, but it is a page that exists to be browsed, and
 * a production API should not answer requests for one.
 *
 * The fixtures are `EMAIL_SAMPLES` from `@mia/templates/samples`, so they are the same
 * data the package type-checks against its own templates. There are deliberately no
 * mock objects in this module: a fixture defined here would drift from the template it
 * is meant to exercise, and drift is exactly what a preview is supposed to catch.
 *
 * Four routes, because a preview is worth little if you cannot get at the real bytes:
 *
 *   GET /email-preview                the first message, with the list
 *   GET /email-preview/:name          one message, in the chrome
 *   GET /email-preview/:name/html     the HTML body alone — what the iframe loads,
 *                                     and what you paste into a real inbox to test
 *   GET /email-preview/:name/text     the plain-text body alone
 */

const NAMES = EMAIL_SAMPLES.map((sample) => sample.name);
const BASE_PATH = '/email-preview';

/** `null` for an unknown name, which every route turns into a 404. */
function find(name: string) {
  return EMAIL_SAMPLES.find((sample) => sample.name === name) ?? null;
}

const NOT_FOUND = `Unknown template. Try one of: ${NAMES.join(', ')}`;

export const emailPreviewRoutes = new Hono<AppEnv>()
  .get('/', (c) => {
    const first = EMAIL_SAMPLES[0]!;
    return c.html(
      previewPage({
        names: NAMES,
        active: first.name,
        message: first.render(),
        basePath: BASE_PATH,
      }),
    );
  })

  .get('/:name/html', (c) => {
    const sample = find(c.req.param('name'));
    if (!sample) return c.text(NOT_FOUND, 404);
    /* The body exactly as SES sends it — no wrapper, no injected styles. */
    return c.html(sample.render().html);
  })

  .get('/:name/text', (c) => {
    const sample = find(c.req.param('name'));
    if (!sample) return c.text(NOT_FOUND, 404);
    return c.text(sample.render().text);
  })

  .get('/:name', (c) => {
    const sample = find(c.req.param('name'));
    if (!sample) return c.text(NOT_FOUND, 404);
    return c.html(
      previewPage({
        names: NAMES,
        active: sample.name,
        message: sample.render(),
        basePath: BASE_PATH,
      }),
    );
  });

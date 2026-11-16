/**
 * The English permissions catalogue is pinned to `@mia/permissions`: one entry
 * per permission, group and bundle (label + description), and nothing stale.
 * A permission added to the package fails here until it has copy, so it can
 * never reach the admin untranslated. Other languages are held to English by
 * the generic parity test in `src/i18n/catalogue.test.ts`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { PERMISSION_BUNDLES, PERMISSION_GROUPS, PERMISSION_LIST } from '@mia/permissions';

const catalogue = JSON.parse(
  readFileSync(new URL('../../i18n/en/permissions.json', import.meta.url), 'utf8'),
) as Record<string, string>;

const expected = [
  ...PERMISSION_GROUPS.map((group) => `group.${group}`),
  ...PERMISSION_LIST.map((permission) => `perm.${permission.key}`),
  ...PERMISSION_BUNDLES.flatMap((bundle) => [
    `bundle.${bundle.key}`,
    `bundle.${bundle.key}.description`,
  ]),
];

test('en/permissions.json has an entry for every permission, group and bundle, and no extras', () => {
  assert.deepEqual(Object.keys(catalogue).sort(), [...expected].sort());
});

test('en/permissions.json repeats the package English', () => {
  for (const permission of PERMISSION_LIST) {
    assert.equal(catalogue[`perm.${permission.key}`], permission.label);
  }
  for (const bundle of PERMISSION_BUNDLES) {
    assert.equal(catalogue[`bundle.${bundle.key}`], bundle.label);
    assert.equal(catalogue[`bundle.${bundle.key}.description`], bundle.description);
  }
});

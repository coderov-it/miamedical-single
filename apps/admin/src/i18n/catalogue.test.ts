/**
 * Catalogue parity. English is the reference key set; every registered
 * language has the same namespace files and no key English lacks; the source
 * language (Italian) has every key, non-empty; placeholders match English.
 * Other languages may have gaps — they fall back to English at runtime.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { LANGUAGE_CODES, SOURCE_LANGUAGE } from '@mia/validators/language';

const ROOT = new URL('./', import.meta.url);
const REFERENCE = 'en';

type Messages = Record<string, string>;

function namespaces(language: string): string[] {
  return readdirSync(new URL(`${language}/`, ROOT))
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .sort();
}

function load(language: string, namespace: string): Messages {
  return JSON.parse(
    readFileSync(new URL(`${language}/${namespace}.json`, ROOT), 'utf8'),
  ) as Messages;
}

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();
}

const referenceNamespaces = namespaces(REFERENCE);

for (const language of LANGUAGE_CODES) {
  test(`${language}: same namespace files as ${REFERENCE}`, () => {
    assert.deepEqual(namespaces(language), referenceNamespaces);
  });

  for (const namespace of referenceNamespaces) {
    test(`${language}/${namespace}.json matches ${REFERENCE}`, () => {
      const reference = load(REFERENCE, namespace);
      const messages = load(language, namespace);

      for (const [key, value] of Object.entries(messages)) {
        assert.ok(
          key in reference,
          `"${namespace}.${key}" is not in ${REFERENCE}/${namespace}.json`,
        );
        assert.equal(typeof value, 'string', `"${namespace}.${key}" must be a string`);
        if (value === '') continue;
        assert.deepEqual(
          placeholders(value),
          placeholders(reference[key] ?? ''),
          `"${namespace}.${key}" placeholders differ from ${REFERENCE}`,
        );
      }

      if (language !== SOURCE_LANGUAGE && language !== REFERENCE) return;
      for (const key of Object.keys(reference)) {
        assert.ok(messages[key], `"${namespace}.${key}" is missing or empty in ${language}`);
      }
    });
  }
}

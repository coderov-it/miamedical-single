/**
 * The languages a CONTRACT exists in — deliberately not `LanguageCode`.
 *
 * A contract is binding legal text, not UI copy. Each variant in this folder
 * was drafted for a jurisdiction and reviewed as a document; a new one is a
 * lawyer's deliverable, not a translation of an existing one. So registering a
 * language in `@mia/validators/language` must NOT silently imply that a
 * contract can be rendered in it — this union stays narrow on purpose, and
 * widening it means a new `*-<language>.ts` variant has been written and
 * approved.
 *
 * The same applies to the two contract emails: they carry the terms of the
 * document they announce, so they follow the document's language, never the
 * customer's interface language.
 */
export type ContractLanguage = 'it' | 'en';

/** Guard for a `contracts.language` column value on its way back out of the database. */
export function isContractLanguage(value: string): value is ContractLanguage {
  return value === 'it' || value === 'en';
}

/**
 * The registry: every category the sync script writes, in the order they appear
 * on the storefront.
 *
 * A category is in the catalogue when it is listed here and not before, so a
 * folder can be written and reviewed without touching the database.
 *
 * Terms documents are collected separately because a product LINKS to one
 * rather than owning it — the document has to be written as its own row first,
 * and two products may share it.
 */
import type { Category, TermsDocument } from '../lib/types.ts';
import { generalRental, depositRental, salesTerms } from './shared/terms.ts';
import usedEquipment from './used-equipment/index.ts';
import wheelchairs from './wheelchairs/index.ts';

export const categories: readonly Category[] = [wheelchairs, usedEquipment];

export const termsDocuments: readonly TermsDocument[] = [generalRental, depositRental, salesTerms];

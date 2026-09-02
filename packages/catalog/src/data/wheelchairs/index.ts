/**
 * The category, assembled. One line per product file.
 *
 * This is the only place that has to change when a product is added: write the
 * file, import it, list it. A product not listed here is simply not in the
 * catalogue — which is also how a half-written one stays out of a sync run
 * without being deleted.
 */
import { wheelchairs } from './category.ts';
import { slimSelfPropelled } from './slim-self-propelled.ts';
import { transitFolding } from './transit-folding.ts';

export default wheelchairs.withProducts([slimSelfPropelled, transitFolding]);

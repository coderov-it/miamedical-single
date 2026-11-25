/**
 * The delivery fee as the storefront displays it — the same figure the server
 * will charge, from the same function, over the same inputs.
 *
 * Inputs: each product's own fee (on the product detail DTO) and the
 * platform-wide fallback, read here from `GET /api/settings/delivery`. The
 * browser never sends an amount; `POST /api/orders` re-reads both and decides.
 * A stale cache can therefore show a different figure for a moment, never
 * charge one. Rules and rationale: docs/code/delivery-fee.md
 */
import { resolveDeliveryFee } from '@mia/pricing';

import { api } from './api.ts';
import { type CachePolicy, cached } from './cache.ts';

/**
 * Short on purpose: an admin changing the fallback should see it on the
 * checkout within about a minute. `stale` keeps the last good value through an
 * outage, which is better than flipping every cart to "unpriced".
 */
const DELIVERY_POLICY: CachePolicy = { fresh: 60, stale: 3600 };

async function fetchFallback(): Promise<string | null> {
  const response = await api.api.settings.delivery.$get();
  if (!response.ok) throw new Error(`GET /api/settings/delivery failed (${response.status})`);
  const { data } = await response.json();
  return data.fallbackFee;
}

/**
 * The platform fallback fee, or `null` (unpriced) when there is none OR the
 * endpoint cannot be read — a settings outage must never break checkout, and
 * "unpriced" is the safe, pre-existing behaviour.
 */
export async function getDeliveryFallback(): Promise<string | null> {
  try {
    return await cached('settings:delivery', fetchFallback, DELIVERY_POLICY);
  } catch (error) {
    console.warn('[delivery-fee] fallback could not be read, showing delivery as unpriced:', error);
    return null;
  }
}

/** A home delivery's fee for these products, or `null` when it is unpriced. */
export function homeDeliveryFee(
  products: readonly { pricing: { deliveryFee: string | null } }[],
  fallback: string | null,
): string | null {
  return resolveDeliveryFee(
    'homeDelivery',
    products.map((product) => product.pricing.deliveryFee),
    fallback,
  );
}

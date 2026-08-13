/**
 * Address suggestions, proxied from HERE.
 *
 * WHY A PROXY and not a call from the browser: an API key in client JavaScript is
 * a key anyone can lift and spend. Ours stays in the server's environment, and the
 * checkout asks us. That also means the shape the storefront depends on is ours —
 * `AddressSuggestionDto` — so replacing the provider later is one file, not a
 * rewrite of the checkout.
 *
 * WHAT IT DOES NOT DO: it does not price anything, and it does not decide what a
 * comune is. No provider returns ISTAT codes (checked for HERE and Google), so the
 * pricing key stays the CAP resolved against our own committed dataset — see
 * docs/code/delivery-pricing.md. This endpoint fills in a form, nothing more.
 */

import { EXTERNAL_APIS } from '../../config/external-apis.ts';
import { FEATURES } from '../../config/features.ts';
import { httpError } from '../../shared/http/errors.ts';
import type { AddressSuggestionDto } from './dto.ts';
import { toSuggestion } from './mapper.ts';
import type { HereAutocompleteResponse } from './types.ts';

/* The host lives in config/external-apis.ts with every other third-party host; the
   path stays here, because it is part of this call's contract. */
const ENDPOINT = `${EXTERNAL_APIS.hereAutocompleteBaseUrl}/v1/autocomplete`;

/**
 * ISO-3, which is what HERE's `in=countryCode` takes — not the ISO-2 `IT` used
 * everywhere else in this codebase. The storefront ships to Italy only.
 */
const COUNTRY = 'ITA';

/** Asked for more than the six shown, because unusable rows are filtered out. */
const FETCH_LIMIT = 12;
const RETURN_LIMIT = 6;

/**
 * A typing customer will not wait, and neither will we: a slow suggestion is worth
 * nothing, and the field still works without one.
 */
const TIMEOUT_MS = 2500;

/**
 * Bound once at boot from `FEATURES.addressSuggestions`, not chosen per request.
 *
 * With no key the export IS the refusal, so there is no branch on the hot path and
 * no code path that could reach HERE without a key: the enabled build cannot answer
 * 503 and the disabled build cannot call out. The endpoint stays mounted either
 * way — an optional feature must not change the shape of `AppType`, which is what
 * types the frontends' RPC client.
 */
function resolveSuggestAddresses(): (query: string) => Promise<AddressSuggestionDto[]> {
  const feature = FEATURES.addressSuggestions;

  if (feature === null) {
    return async () => {
      throw httpError(
        503,
        'Address suggestions are not configured. Set HERE_API_KEY on the server and restart.',
        'service_unavailable',
      );
    };
  }

  return (query) => fetchSuggestions(query, feature.apiKey);
}

export const suggestAddresses = resolveSuggestAddresses();

async function fetchSuggestions(query: string, apiKey: string): Promise<AddressSuggestionDto[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('in', `countryCode:${COUNTRY}`);
  url.searchParams.set('limit', String(FETCH_LIMIT));
  url.searchParams.set('lang', 'it');
  url.searchParams.set('apiKey', apiKey);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    // Timed out or unreachable. Reported as an upstream failure rather than a 500:
    // nothing here is broken, and the checkout treats it as "no suggestions".
    throw httpError(502, 'The address service did not answer.', 'bad_gateway');
  }

  if (!response.ok) {
    /* Never surfaced verbatim: HERE's own error bodies quote the request, and the
       request contains the key. */
    throw httpError(502, 'The address service refused the request.', 'bad_gateway');
  }

  const payload = (await response.json()) as HereAutocompleteResponse;
  const suggestions: AddressSuggestionDto[] = [];
  for (const [index, item] of (payload.items ?? []).entries()) {
    const suggestion = toSuggestion(item, index);
    if (suggestion) suggestions.push(suggestion);
    if (suggestions.length === RETURN_LIMIT) break;
  }
  return suggestions;
}

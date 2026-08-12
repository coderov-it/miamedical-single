# Address autocomplete

The checkout's street field completes from HERE. Ours is a proxy, not a client
integration: `apps/server/src/modules/address/`, called by the combobox in
`apps/website/src/pages/checkout.astro`.

| Endpoint | For |
| --- | --- |
| `GET /api/address/suggest?q=` | public; a fragment of a street → up to 6 pickable addresses |

Set `HERE_API_KEY` on the server. Without it the endpoint answers 503 and the
customer types the address by hand — see "What happens with no key".

---

## The walk

```
1. customer types                "via ostie"        (3-char minimum, 250ms debounce)
2. browser                       GET /api/address/suggest?q=via%20ostie
3. server → HERE                 GET autocomplete.search.hereapi.com/v1/autocomplete
                                   ?q=via ostie&in=countryCode:ITA&limit=12&lang=it
                                   &apiKey=…                    ← never leaves the server
4. HERE returns 12 items         some are streets, some whole comuni
5. mapper keeps                  only items with street + city + a 5-digit CAP,
                                 first 6                        → 3 rows here
6. list shows                    Via Ostiense 44, 00154 Roma RM
                                 Via Ostiense 175, 00154 Roma RM
                                 Via Ostiglia 3, 00182 Roma RM
7. customer picks the second     address  → "Via Ostiense 175"
                                 comune and CAP    → UNTOUCHED
```

**It fills the street line and nothing else.** The comune and the CAP come from the
cascading picker above the field, where the comune is a six-digit ISTAT code rather
than a provider's spelling of a name. It used to fill all three; letting a
suggestion overwrite the comune would put HERE in charge of which area the delivery
is priced against, and HERE cannot return an ISTAT code at all.

So the price is already settled by the time this field is touched — see
`docs/code/storefront-checkout.md`.

## The fallback walk — no key, or HERE is down

```
1. customer types                "via ostie"
2. server has no HERE_API_KEY    → 503 { code: 'service_unavailable' }
   (or the fetch times out at 2.5s → 502)
3. browser catch                 closes the list, reports nothing
4. customer types the street     by hand
5. the fee is already known      it came from the comune, not from this field
```

The street is an ordinary input. Nothing about the order — and now nothing about the
price — depends on a suggestion having been used, which is why a missing key
degrades to "slower to fill in" rather than to a broken checkout. That is also why
no key has been bought yet.

## Why a proxy

An API key in browser JavaScript is a key anyone can lift and spend. The key lives
in the server's environment and the browser asks us.

It also means the shape the checkout depends on is **ours** —
`AddressSuggestionDto` — so changing provider is one mapper, not a rewrite of the
checkout.

## Why `/autocomplete` and not `/autosuggest`

HERE's `/autosuggest` is built for places and categories: it answers "burger" with
restaurant chains, and its street results carry no structured address. `/autocomplete`
is address-first, takes `in=countryCode:ITA`, and returns `street`, `houseNumber`,
`city` and `postalCode` on every item — which is what lets one pick fill three
fields with no second `/lookup` round trip.

## What it does not do

**It does not price anything, and no longer touches what does.** No provider returns
ISTAT codes — checked for HERE and Google — so the pricing key is the comune code
the customer picks from our own committed dataset. See
`docs/code/delivery-pricing.md`.

**It does not validate.** A customer may ignore every suggestion and type a street
HERE has never heard of; the order takes it.

**It does not store a provider id.** `AddressSuggestionDto.id` keys a list for one
keystroke and is discarded. Nothing in `orders` refers to HERE.

## Cost shape

One request per debounced keystroke burst, per customer, per address. The 3-char
minimum is what stops `v`, `vi` — the two queries that match half of Italy — from
being paid for at all. Responses are `private, max-age=60`, so backspacing over a
word costs nothing.

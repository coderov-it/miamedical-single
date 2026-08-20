# Storefront caching

The home page renders on demand. This is what keeps that cheap, and what each
layer is actually for.

Measured on the production build, warm process, 8-core box, 53 KB home page:

|                           | median | p95    | saturation  |
| ------------------------- | ------ | ------ | ----------- |
| `/` prerendered, off disk | 0.8 ms | 1.3 ms | ~2000 req/s |
| `/` SSR, no cache         | 8.1 ms | 9.6 ms | 231 req/s   |
| `/` SSR, `cached()` warm  | 2.2 ms | 3.8 ms | 600 req/s   |

The 6 ms `cached()` removes is not template work — it is two API round trips.
Astro renders those 53 KB in ~4 ms and that number does not move.

## Why on demand at all

The hero and the trending rail are live catalogue state, and `trending` filters
on `inStock`. Prerendering publishes the stock and prices as they stood at build
time, so a product added, retired or sold out stays wrong until someone deploys.
It also makes `pnpm build` require a running API — an API that is down at build
time bakes an empty hero into `index.html` permanently, which is the failure that
started this.

`/assistenza/` reads no data and stays prerendered.

## Layer 1 — `lib/cache.ts`, data in this process

`cached(key, read, policy)` around each catalogue read. `CATALOG_POLICY` is
`fresh: 240, stale: 3600`.

```
t+0s      first request      MISS  → one API call → stored
t+0..240  every request      HIT   → 0 API calls, any concurrency
t+241     next request       STALE → serves stored value, refills behind it
t+241     the one after      HIT   → new value
t+3841    next request       EXPIRED → this request waits for the API
```

At 4 minutes the whole site costs the API one products call and one categories
call per 4 minutes, whatever the traffic.

Three properties, in the order they matter:

- **single-flight.** 32 concurrent cold requests make one API call, not 32.
  This is most of the 231 → 600 req/s.
- **stale-while-revalidate.** Nobody waits on a refresh that is seconds overdue.
- **stale-if-error.** The last good value is kept indefinitely. An API outage
  serves slightly old products; it does not empty the hero. Verified by cutting
  the API off from a warm process — the page still rendered its products.

`safely()` in `lib/catalog.ts` is the layer under that, and now only catches one
case: a cold cache _and_ a dead API. Those sections hide themselves.

The cache is per process and dies with a restart — one API call per key to warm,
not a correctness problem. `invalidate(key?)` exists for when instant purge is
needed; nothing calls it yet (see "not built" below).

## Layer 2 — `lib/http-cache.ts`, what caches in front may do

`cacheHtml(Astro.response.headers)` on a page whose HTML is identical for every
visitor. It is safe on the home page specifically because nothing there reads a
cookie: the cart badge and the account link are filled in by the browser.

```
cache-control: public, max-age=0, must-revalidate,
               s-maxage=60, stale-while-revalidate=300, stale-if-error=86400
```

`max-age=0` keeps browsers revalidating; they get a 304. `s-maxage` is the only
number a shared cache reads. Cart, checkout and the customer area set
`no-store` instead and are never touched by any of this.

## The staleness budget

An admin edit may take **5 minutes** to reach a visitor. That is a decision, not
a limitation, and it is spent as **layer 1 `fresh` + layer 2 `s-maxage`**:

```
240 s   CATALOG_POLICY.fresh    lib/cache.ts
 60 s   PUBLIC_PAGE.sMaxAge     lib/http-cache.ts
─────
300 s   worst case from save to visible
```

Raising one means lowering the other. `stale-while-revalidate` does not count
against it: past the window the first request gets the stale copy and triggers a
refresh that takes milliseconds, so the request after it is already current — the
number is the size of the window in which that strategy is allowed, not a
duration of stale service.

## Layer 3 — `src/middleware.ts`, conditional requests

Prerendering gave 304s away for free: a file on disk has an ETag and a
Last-Modified. An SSR response has neither, so without this every browser
revalidation re-sends 53 KB.

The middleware hashes the rendered HTML, sets a strong ETag, and answers a
matching `If-None-Match` with a bodyless 304. It only touches responses whose
`Cache-Control` says `public` — so `no-store` pages are never buffered and keep
streaming, which is the point of the gate.

`If-None-Match` is matched on the opaque part, ignoring a `W/` prefix, because
any proxy that re-encodes the body downgrades a strong tag to a weak one and an
exact comparison would then cost every visitor a full 200.

## Layer 4 — nginx, in `docs/nginx/*.conf`

Three gaps that measurement turned up, all fixed in the web vhost:

- **No compression at all.** The Node adapter compresses nothing, so 53 KB of
  HTML and 74 KB of CSS crossed to the edge raw. `gzip_proxied any` is the part
  that is easy to miss — without it nginx will not compress a proxied body.
- **`/fonts/*.woff2` served `max-age=0`.** Now a year, `immutable`. Fonts are
  not content-hashed, so a replacement must be a new filename, never an
  overwrite.
- **`/img/`, `/favicon.svg` served `max-age=0`.** Now a week — they _are_
  replaced in place, and a week is the longest wait worth accepting.

`/_astro/` needed nothing: those names carry a content hash and the adapter
already sends `max-age=31536000, immutable`.

## The deploy hazard, if HTML is ever cached at the edge

TLS terminates at Cloudflare, and Cloudflare does not cache HTML unless a Cache
Rule says to. Nothing does today, so `s-maxage` is currently inert — correct and
ready, not load-bearing.

Turning it on adds one failure mode. Cached HTML outlives the hashed assets it
points at:

```
10:00  edge caches /  → HTML references /_astro/index.BbWuw6qo.js
10:30  deploy: rsync --delete → that file is gone, the new build emitted …Xy7Qk2Lm.js
10:30  edge still serves 10:00's HTML → the browser 404s on the script
       → unstyled page, dead carousels, until the edge TTL runs out
```

So a Cache Rule for HTML requires a cache purge in the deploy, before the
restart. Same class of bug the admin vhost already guards with
`location = /index.html { add_header Cache-Control "no-cache"; }`.

At a 4 ms warm render, edge HTML caching is not worth that step yet. The
recommendation is to leave it off until traffic says otherwise.

## Not built, deliberately

**Instant invalidation on an admin edit.** It would need the API to call a
revalidation endpoint on the website with a shared secret — a new cross-service
contract, an env var, and a route. Not worth it against an accepted 5-minute
budget. `invalidate()` in `lib/cache.ts` is the hook if that budget ever
tightens; nothing calls it today.

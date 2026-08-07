# Admin client layer

The four modules under `apps/admin/src/lib/` that every screen is built on:
`resource.svelte.ts`, `query-state.svelte.ts`, `dirty.svelte.ts` and `format.ts`.

They exist because the admin had none of them, and the same twenty-line block
was hand-copied into every page — each copy racing slightly differently.

---

## `Resource` — the one async pattern

```ts
const products = new Resource(
  () => query.current,
  async (current, signal) =>
    unwrapFull<ListResponse>(
      await api.api.admin.products.$get({ query: { ... } }, { init: { signal } }),
    ),
  { enabled: () => session.can(P.PRODUCT_READ) },
);
```

Construct it during component initialisation. It owns an `$effect`, and that
is what ties an in-flight request to the component's lifetime.

### Why both an abort _and_ a request-id guard

Aborting the superseded request is not sufficient on its own. A response can
already have arrived and be part-way through `response.json()` when the next
request starts; the abort then lands on a body stream that is nearly drained,
and the outcome is timing-dependent. So every run takes a monotonic id and
drops itself on resolve if a newer one has started. The abort is still there —
it stops the network work — but correctness rests on the id.

`set()` bumps the id too, which is what makes "adopt the payload the mutation
just returned" safe: any request still in the air is now, by definition, older.

### `loading` vs `hasData`

`data` is deliberately **not** cleared while refetching. Two flags come out of
that:

|                       | meaning                      | render                             |
| --------------------- | ---------------------------- | ---------------------------------- |
| `loading && !hasData` | first load, nothing to show  | skeleton rows                      |
| `loading && hasData`  | refreshing what is on screen | keep the table, show the sweep bar |

Replacing a table with the word `Loading…` on every filter change throws away
the reader's scroll position and makes the page jump. `ListCard` enforces this
split so no page has to remember it.

### Where `finally` matters

```ts
} finally {
  if (id === this.#latest) this.#loading = false;
}
```

The guard stops a superseded request from clearing the _newer_ one's spinner.
`finally` runs on the abort path too — which is what unsticks `loading` when a
resource is disabled mid-flight (`enabled` flipping to false aborts the
request, and nothing else would ever turn the spinner off).

### Interaction with the Hono client

`{ init: { signal } }` is safe alongside the client-level
`init: { credentials: 'include' }`. Hono `deepMerge`s the two, and because
`AbortSignal` is reached as a leaf value it is assigned by reference rather
than recursed into.

---

## `QueryState` / `QueryDraft` — filters in the URL

`QueryState` derives its values from `page.url.searchParams` rather than
mirroring them into local state. One source of truth means Back, a pasted
link, and a programmatic `set()` all arrive by the same path.

The defaults object defines both the shape and the parse target: a `number`
default parses with `Number`, anything else stays a string. Values equal to
their default are dropped from the URL, so an unfiltered list keeps a clean
`/products`.

**Changing any non-page key resets the page.** That is the fix for a live bug —
filtering while on page 4 used to leave you on "page 4 of 1 result".

Navigation uses `noScroll: true, keepFocus: true`. These are same-page state
changes, not departures: throwing the reader to the top or dropping focus out
of the filter form would both be wrong.

### The `untrack` in `QueryDraft`

`QueryDraft` holds the uncommitted values an Apply-style filter form binds to.
It re-seeds from the committed values when they change underneath it (Back, a
Clear, a link carrying its own query).

The re-seed compares key by key so an unrelated URL change cannot clobber
half-typed input — and that comparison **must** read `values` inside
`untrack()`:

```ts
$effect(() => {
  const committed = state.current; // the only tracked read
  untrack(() => {
    for (const key of Object.keys(committed)) {
      if (this.values[key] !== committed[key]) this.values[key] = committed[key];
    }
  });
});
```

Without it the effect subscribes to its own output: typing writes `values.q`,
which re-runs the effect, which sees `values.q !== committed.q` and writes the
committed value straight back. The search box empties itself on every
keystroke. This was caught in the browser, not by the typechecker.

### Why `__any` and not `''` for "no filter"

bits-ui's `Select` treats an empty string as _no selection_ and renders the
placeholder. A sentinel keeps "All statuses" visible as a real, selected
option. The sentinel is stripped before the request is built.

---

## `DirtyState` — unsaved work

Two jobs, deliberately kept apart:

- The tab strip shows a dot on each section with unsaved edits.
- `unsaved-changes-guard.svelte` blocks navigation **away from the page**.

Switching tabs is _not_ blocked. The panels stay mounted, so nothing is lost,
and a confirm dialog guarding a danger that no longer exists just teaches
people to dismiss dialogs without reading them. The guard skips any navigation
whose pathname is unchanged, which is what lets `?tab=` and `?order=` through.

`beforeNavigate` is synchronous and cannot await an answer, so the guard
cancels the navigation, asks, and re-issues it with `goto` on Discard. The
`bypass` flag is a plain `let`, not `$state`: the re-issued `goto` has to see
the new value in the same tick, before any reactive update could land.

`navigation.type === 'leave'` (tab close, hard reload) is the one case we
cannot render into. Cancelling hands off to the browser's own prompt.

---

## `format.ts` — the em-dash rule

`—` means _there is nothing here_, and only absence is allowed to produce it.

A value we **do** have but cannot parse is a bug. Rendering it as `—` disguises
that bug as a deliberate blank, so those paths return the raw input instead,
where it will be noticed. Nothing in this module can emit `NaN` or
`Invalid Date`.

### Two locales, on purpose

|       | locale  | why                                                                                                                                            |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| dates | `en-GB` | day-first and 24-hour, matching how an Italian back office reads a date, but with English month names so they do not clash with the English UI |
| money | `it-IT` | the admin should show the same string the customer's invoice does                                                                              |

`formatMoney` takes the wire's decimal **string** and only ever hands it to
`Intl`. Money is `numeric(12,2)` in Postgres and stays exact across the wire;
nothing in the client does arithmetic on it.

`relativeTime` takes an optional `now` so a list of rows is formatted against
one clock — otherwise two events a millisecond apart can render as "1 minute
ago" and "2 minutes ago".

---

## Shared list chrome

`list-card.svelte` is the shape every list screen takes: header (count +
filters) → table → status → pager. Its one job is enforcing that **the table is
never unmounted**; error, empty and loading render as siblings below it. Only
the genuine first load, when `meta` is still `undefined`, renders skeletons in
the table's place.

`pager.svelte` reads the `{ page, perPage, total, pageCount }` envelope every
list endpoint returns and states the range ("1–20 of 337") rather than the page
number alone, because that answers the question people actually have.

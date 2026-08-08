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

### `sortable-list.svelte` — reordering that says what it does

Used by the Pricing, Variants, SKUs, Addons, FAQs and Questions tabs. Each row
is an L2 well containing an L3 content card (see
`docs/code/admin-theme-elevation.md`), opened by a header strip.

The first version put two ghost chevrons in a left gutter and an `X` on the
right — three bare 24px icons per row, and operators could not tell what they
were for. Three things were wrong, and none of them was the icon glyphs:

- **Nothing said the list was ordered.** Chevrons only read as "reorder" if you
  already know position is meaningful. The fix is the ordinal: each row is
  titled `{label} {n}` — "Question 2", "Package 3". The number is the thing that
  makes the arrows self-explanatory, so the arrows sit immediately beside it, in
  the header, not in a gutter at the far edge of the row.
- **Two ghost buttons read as two unrelated marks.** They are now an attached
  `ButtonGroup` of `outline` buttons at `icon-sm`. A pair of opposed arrows
  sharing a border is a single control; two floating glyphs are not. Outline
  also gives them a surface, which `ghost` denied them until hover.
- **Destroy was the least legible control on the row.** `X` became a labelled
  "Remove" with a trash icon and a destructive hover, pushed to the far end so
  it is not adjacent to the two buttons people click repeatedly.

The reorder pair is omitted entirely at `items.length < 2` — a lone row cannot
move, and two permanently disabled buttons are just noise to decode.

### `reorder.svelte.ts` — showing the move, not just doing it

Three lists reorder by hand — `sortable-list.svelte`, `spec-field-list.svelte`
and `media-dropzone.svelte`. All three used to swap instantly: two rows
exchanged content between frames, and nothing told you which row you had just
moved or where it had gone. On a tall row the two states can look almost
identical, so the operator clicks again to check, and now it is genuinely lost.

`Reorder` supplies the two halves of the answer, so the three lists cannot drift
apart:

- **`flip`** — `animate:flip` params. The rows are already keyed by a stable id
  (they have to be, see above), which is exactly what `animate:` needs, so the
  slide costs one directive per list. `duration` scales with distance travelled:
  a swap moves each row by its neighbour's height, and these lists run from a
  60px media tile to a 250px questions row, so one flat duration either crawls
  on the short lists or reads as a jump-cut on the tall ones. It returns `0`
  under `prefers-reduced-motion`.
- **`ring(key)`** — a 2px primary ring on the row that moved, faded out by
  `transition-shadow duration-500` after ~1.1s. This exists because a tall row
  can travel further than the viewport shows, so the slide alone is not always
  followable. Being colour rather than motion, it is also the half that survives
  `prefers-reduced-motion` — which is precisely when the slide is unavailable.

`animate:` only works on an _element_, so `spec-field-list` wraps its
`Collapsible.Root` in a plain `div` to have something to put it on. Note also
that a flip animation runs on reorder **and** on removal — the survivors' indices
change, so they slide up to close the gap — but never on append, which is why
adding a row still lands instantly.

`label` is the singular noun for a row and defaults to `"Item"`. It is separate
from `describe`, which yields a row's _content_ ("this question", the FAQ's
text) and is only ever spoken: it feeds the buttons' `aria-label`, so a screen
reader hears "Move floor number up" rather than "Move up, button, button".

Tooltips wrap the arrows via the `child` snippet, and the trigger's props are
composed with `mergeProps` rather than spread — a bare spread would drop the
trigger's own handlers on the floor, and the tooltip would never open.

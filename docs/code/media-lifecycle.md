# Media lifecycle: commit, rollback, sweep

A save moves new uploads out of `_staging/`, then writes the row. It never
deletes the object it replaces. If the write fails, it deletes only what it
committed. Objects that nothing references any more are removed later by the
sweep.

Code: `apps/server/src/modules/products/media/service.ts` (`withMediaRollback`,
`commitProductMedia`, `commitIcon`), `apps/server/src/modules/media/sweep.ts`,
`orphans.ts`, `references.ts`.

## A product save

Product `p1` shows `products/p1/aaaaaaaa-old.webp`. The admin replaces it.

```
normal case                                         bucket after the step
1  upload new.webp            → _staging/1111…/new.webp        old.webp, _staging/…/new.webp
2  PATCH /api/admin/products/p1 { media.thumbnail: _staging/1111…/new.webp }
3  commitProductMedia moves it → products/p1/11111111-new.webp  old.webp, 11111111-new.webp
   and logs that key in `committed`
4  repo.update writes the row  → row points at 11111111-new.webp
5  nothing is deleted          → old.webp stays, referenced by no row
6  sweep, ≥ 24 h later         → old.webp listed, no row names it → deleted
```

```
DB write fails                                      bucket after the step
1–3  as above                                       old.webp, 11111111-new.webp
4    repo.update throws (constraint, connection)    row still points at old.webp
5    withMediaRollback deletes `committed` only     old.webp
     → 11111111-new.webp deleted, old.webp untouched, error goes to the client
```

The rollback covers a failure inside the commit too. A gallery of two new photos
where the second has no staging object: the first was already moved, so it is in
`committed` and is deleted. Siblings are awaited with `allSettled` before the
rollback runs, so a move still in progress has logged its key by then.

Icons work the same way (`commitIcon`) in category update, spec replace and
addon replace. When a whole entity is deleted, its objects are still deleted
right away, but only after the DELETE has succeeded.

## The sweep

On boot, then hourly. Staging objects older than `MEDIA_STAGING_TTL_HOURS` are
deleted. Then the final-object pass runs:

```
bucket (products/, addons/, categories/, specs/)      decision
products/p1/11111111-new.webp   2 h old                kept: younger than 24 h
products/p1/aaaaaaaa-old.webp   3 d old, in no row     deleted
products/p2/cccccccc-x.webp     3 d old, in p2.media   kept
products/p3/dddddddd-m.pdf      3 d old, in a blog
                                body as a full CDN URL kept: the key is a substring
contracts/…, _staging/…                                never listed by this pass
```

Steps:

1. List the four prefixes and keep the objects older than 24 h.
2. Then, after the listing, load every string that might name a key
   (`references.ts`). That means the key columns, every leaf of `products.media`
   and `chips`, and the free text where an admin could paste a link.
3. An object is an orphan if its key does not appear in any of those strings.

When it refuses:

```
database returned no strings at all          → nothing deleted, warning logged
orphans > 50 % of ≥ 20 listed objects        → nothing deleted, "is this the right database?"
MEDIA_ORPHAN_SWEEP=report (the default)      → dry run: logs the count, deletes nothing
```

Deleting is opt-in: set `MEDIA_ORPHAN_SWEEP=delete` on the one deployment whose
database owns the bucket (resolved at boot in `config/features.ts`, printed in the
startup summary). A second deployment on the same bucket but another database —
the dev instance, say — would see the first one's objects as orphans; above 50 %
the breaker catches that, below 50 % it does not. So it keeps the default.

A new column that stores an object key goes into `loadMediaReferences` in the
same change.

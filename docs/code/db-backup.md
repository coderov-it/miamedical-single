# Database backup

Every 4 hours (UTC slots 00, 04, 08, 12, 16, 20) `pg_dump` writes a copy on the VPS disk and a copy into a separate private R2 bucket. Ten days are kept. Off unless `DB_BACKUP=on`.

```
DB_BACKUP_FOLDER miamedical-prod, bucket miamedical-backups, now = 2026-11-23T06:30Z

1. slot        = 2026-11-23T04:00Z    (UTC hour floored to a multiple of 4)
2. local file  = ~/.local/data/backups/miamedical-prod/2026-11-23/miamedical-prod_2026-11-23_04-00Z.dump
3. R2 key      = miamedical-prod/2026-11-23/miamedical-prod_2026-11-23_04-00Z.dump   (bucket miamedical-backups)
4. local prune = delete day folders under ~/.local/data/backups/miamedical-prod/ named YYYY-MM-DD and < 2026-11-14
                 (today + 9 previous days = 10 kept). Anything that is not a YYYY-MM-DD dir is never touched.
5. R2 prune    = day folders under `miamedical-prod/` named YYYY-MM-DD and < 2026-11-14 (same rule as local),
                 deleted only after this slot's upload succeeded.
```

The name carries the slot time, not the wall clock: a dump taken at 06:30 fills the 04-00Z slot, so a repeat finds the file and does nothing. A failed R2 upload is retried on the next tick (every 10 minutes) without dumping again. A run still `running` after 60 minutes (the server died mid-dump) is marked failed as interrupted by the next tick. An advisory lock (`7_301_002`) keeps pm2 workers from dumping together.

## Manual backup

Admin, Settings, Database tab: type a name, press "Back up now". Independent of the schedule (no lock, one at a time per process).

```
name "before-price-update", now = 2026-11-23T14:32:10Z

local  ~/.local/data/backups/miamedical-prod/manual_2026-11-23/before-price-update_2026-11-23_14-32Z.dump
R2     miamedical-prod/manual_2026-11-23/before-price-update_2026-11-23_14-32Z.dump
```

`manual_*` folders are never auto-pruned (`expiredDays` only matches exact `YYYY-MM-DD`); delete them by hand. The same name in the same minute is a 409.

## Log and permissions

Table `db_backups`: one row per file, scheduled or manual (status, size, error, uploaded or not). A failed scheduled slot reuses its row (`attempts` + 1); rows outlive pruned files. Downloads stream the local file, so a pruned one is no longer downloadable.

- `setting:backup_read` (1610): see the log, download. `setting:backup_create` (1611): run a manual backup. In no bundle; grant explicitly, a backup holds all customer data.

```
~/.local/data/backups/            R2 bucket miamedical-backups
└─ miamedical-prod/               └─ miamedical-prod/
   ├─ 2026-11-23/                    ├─ 2026-11-23/
   │  └─ ..._04-00Z.dump             │  └─ ..._04-00Z.dump
   └─ manual_2026-11-23/             └─ manual_2026-11-23/
```

## Restore

```
1. get the file   download the .dump from R2, or take the local one
2. restore        pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" miamedical-prod_2026-11-23_04-00Z.dump
```

## One-time setup

- `pg_dump` 16+ (with zstd) on the server's PATH.
- Create a private R2 bucket (no custom domain, no r2.dev access) and set `DB_BACKUP_R2_BUCKET`. It must differ from `R2_BUCKET`; the server refuses to start otherwise.
- Optional: an R2 API token scoped to that bucket, in `DB_BACKUP_R2_ACCESS_KEY_ID` / `DB_BACKUP_R2_SECRET_ACCESS_KEY` (both or neither). Unset, the `R2_*` keys are used.
- Set `DB_BACKUP=on` and `DB_BACKUP_FOLDER`.

No R2 lifecycle rule: if the server stops, old backups are kept instead of expiring.

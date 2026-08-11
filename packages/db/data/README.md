# Committed reference data

Generated, not hand-edited. To rebuild:

```bash
pnpm --filter @mia/server istat:build
```

That script downloads the sources, joins them, prints a report worth reading, and
overwrites both CSVs. Commit the result — the seed reads these files and must work
with no network, and a deploy should load exactly the rows someone reviewed rather
than whatever upstream says that day.

| File | Rows | Contents |
| --- | --- | --- |
| `istat-comuni.csv` | 7,896 | `istat_code,name,name_normalised,province_code,region_code` |
| `istat-comune-caps.csv` | 9,142 | `istat_code,cap` — which CAPs each comune contains |

Loaded into `istat_comuni` and `istat_comune_caps` by
`apps/server/script/seed.ts`. The design is in
[`docs/code/delivery-pricing.md`](../../../docs/code/delivery-pricing.md).

## Sources and licences

- **[ISTAT — Codici delle unità amministrative territoriali](https://www.istat.it/it/archivio/6789)**
  (`Elenco-comuni-italiani.csv`). The comune list, its 6-digit codes, provinces and
  regions. Istituto Nazionale di Statistica data is freely reusable with
  attribution (CC-BY 3.0 IT).
- **[GeoNames postal codes](https://download.geonames.org/export/zip/)** (`IT.zip`)
  and **[GeoNames gazetteer](https://download.geonames.org/export/dump/)**
  (`IT.zip`). CAPs, and the `admin3` codes that tie a place to its comune.
  Licensed **[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)** —
  attribution is required wherever this data is redistributed, which is why this
  section exists.

Neither source has both halves: ISTAT publishes no CAPs, and GeoNames publishes no
ISTAT codes in its postal file. The join is done once, here, at build time.

## Known imperfections

The build report prints these every run; they are recorded here so nobody has to
re-derive them.

- **All 4,735 Italian CAPs resolve to a comune.** This is the direction the
  checkout depends on, and it is complete.
- **33 CAPs are resolved by proximity**, because GeoNames names only a frazione for
  them and no comune list contains that name. They land in the right region, and
  usually the right comune, but a few land on a neighbour — `63020` resolves to
  Ascoli Piceno where Falerone would be right. The alternative was leaving those
  CAPs unresolved, which would have sent them to the country-wide fallback instead.
- **2 comuni have no CAP** — Montecopiolo (RN) and San Basilio (SU), both moved
  province recently enough that GeoNames has not caught up. They can still be
  priced through their province.
- **860 CAPs (18%) are shared by more than one comune**, up to 45 of them on
  `24060` in the Bergamo hills. This is why a CAP alone cannot always pick a price,
  and why the quote resolver falls back to the province rather than guessing.

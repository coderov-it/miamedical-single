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

### Why GeoNames and not the official CAP list

There isn't one to download. Poste Italiane assigns Italian CAPs and does **not**
publish them as open data — no bulk file, nothing on `dati.gov.it`. They sell the
authoritative version as *CAP Professional* and *CAP Street File*, and the latter is
the only source of the sub-comune zones for the ~41 multi-CAP cities. If it is ever
bought, it replaces the GeoNames half of the join and nothing else changes.

## How accurate is it?

The comune half is **provable**: it is ISTAT's own register, and a rebuild
reproduces `istat-comuni.csv` byte-for-byte.

The CAP half cannot be proved from free data, so it was cross-checked against a
fully independent source — OpenStreetMap comune relations, which carry `ref:ISTAT`
and `postal_code` (7,893 comuni pulled via Overpass):

```text
comparable — both sources have CAPs      3,078   (39% of Italy; OSM has no
                                                  postal_code on 4,811 comuni)
  CAP set identical                      2,776    90.2%
  partial overlap                          225     7.3%
  share no CAP at all                       77     2.5%
```

Both sources are wrong in places. Ours is stale on Ravenna (`48100`, retired; OSM
says `48121–48125`) and plainly wrong on Livigno (`23030` + `23100`; Livigno is
`23041`). OSM in turn puts Rezzago on `20056`, a Milan-province CAP. Neither is
Poste, so neither settles it.

The invariant that would catch a bad join comes out clean:

```text
CAPs spanning two regions   4    and all four are real anomalies, not join errors:
                                 Sappada 32047 (moved BL→UD, kept its CAP)
                                 Sassofeltrio 61013 (moved PU→RN)
                                 Massimino 12071, Briga Alta 18025 (served across
                                 the province border)
```

**Why 90% is enough anyway.** A price is keyed on the comune's ISTAT code, which
the checkout's cascading picker supplies exactly. A missing or wrong CAP row costs a
datalist suggestion, never a price — see the first walk in
[`docs/code/delivery-pricing.md`](../../../docs/code/delivery-pricing.md). It would
cost money only where a CAP arrives with no comune attached, which is the path the
picker removed.

Two things still worth doing, in order of value: fix the ~30 multi-CAP cities by
hand (their CAPs are contiguous published ranges — Milano is exactly 20121–20162),
and review the 77 no-overlap comuni one line each.

## Known imperfections

The build report prints these every run; they are recorded here so nobody has to
re-derive them.

- **All 4,735 CAPs in the source resolve to a comune.** The join loses nothing. That
  is not the same as covering every CAP Italy has: GeoNames itself is short, and the
  gaps are in the big cities — `20130` Milano and `00129` Roma are absent outright,
  and Milano lists 38 of 42, Roma 74 of 82, Napoli 25 of 27. Torino is complete.
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

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { inflateRawSync } from 'node:zlib';

import {
  istatComuneCapsCsvPath,
  istatComuniCsvPath,
  istatProvincesCsvPath,
  istatRegionsCsvPath,
} from '@mia/db/reference';

import { comuneNameCandidates, normaliseComuneName } from '../src/modules/delivery/name.ts';

/**
 * Builds the two committed reference CSVs behind delivery pricing:
 *
 *   packages/db/data/istat-comuni.csv       one row per comune
 *   packages/db/data/istat-comune-caps.csv  which CAPs each comune contains
 *
 * Run by hand, roughly yearly:  pnpm --filter @mia/server istat:build
 *
 * WHY THREE SOURCES. No single free dataset has both halves. ISTAT is the only
 * authority for the comune list and its codes, and publishes no CAPs. GeoNames'
 * postal file has the CAPs but, for Italy, leaves admin3 empty — its place-name
 * column mixes comuni with frazioni, so ~19% of rows name a hamlet no comune list
 * contains. GeoNames' *dump* file does fill admin3, and for Italy admin3 IS the
 * ISTAT code, which is what turns those hamlets into their parent comune.
 *
 * Every number this prints is worth reading. The CAP → comune direction is what
 * the checkout depends on, and it is complete: all 4,735 Italian CAPs resolve.
 * The reverse has a small tail — a handful of comuni that changed province or
 * name after GeoNames' last sync — and the report names each one.
 *
 * The output is committed so the seed needs no network and a deploy loads exactly
 * the rows someone reviewed. See docs/code/delivery-pricing.md.
 */

const SOURCES = {
  /** ISTAT's current comune list. Semicolon-separated, windows-1252, CRLF. */
  comuni: 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv',
  /** GeoNames postal codes for Italy. CC-BY 4.0 — attribution is in data/README.md. */
  postal: 'https://download.geonames.org/export/zip/IT.zip',
  /** GeoNames full gazetteer for Italy, the only source of admin3 = ISTAT code. */
  gazetteer: 'https://download.geonames.org/export/dump/IT.zip',
} as const;

/** A geo-rescued CAP farther than this from its comune is reported, not trusted. */
const MAX_RESCUE_KM = 15;

const cacheDir = new URL('../node_modules/.cache/istat-dataset/', import.meta.url);

// --- fetching ---------------------------------------------------------------

/**
 * Downloads once and caches, so re-running while tuning the join does not hammer
 * ISTAT or GeoNames. Delete apps/server/node_modules/.cache/istat-dataset to
 * force a refresh.
 */
async function fetchCached(url: string, cacheName: string): Promise<Buffer> {
  const path = new URL(cacheName, cacheDir);
  try {
    const cached = readFileSync(path);
    console.log(`  · ${cacheName} from cache (${(cached.length / 1024).toFixed(0)} kB)`);
    return cached;
  } catch {
    // Not cached yet.
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(path, body);
  console.log(`  · ${cacheName} downloaded (${(body.length / 1024).toFixed(0)} kB)`);
  return body;
}

/**
 * Pulls one file out of a zip, reading the central directory rather than scanning
 * for local headers — a local header may carry zeroed sizes with the real ones in
 * a trailing data descriptor, and the central directory always has them.
 *
 * A dependency-free reader is worth ~40 lines here: the alternative is shipping a
 * zip library, or shelling out to `unzip` and having this fail on a machine that
 * does not have it.
 */
function unzipEntry(zip: Buffer, wantedName: string): Buffer {
  // End of central directory: signature PK\5\6, within the last 64 kB + 22 bytes.
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i -= 1) {
    if (zip.readUInt32LE(i) === 0x0605_4b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file: no end-of-central-directory record');

  const entryCount = zip.readUInt16LE(eocd + 10);
  let cursor = zip.readUInt32LE(eocd + 16);

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (zip.readUInt32LE(cursor) !== 0x0201_4b50) throw new Error('corrupt central directory');
    const method = zip.readUInt16LE(cursor + 10);
    const compressedSize = zip.readUInt32LE(cursor + 20);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    const localOffset = zip.readUInt32LE(cursor + 42);
    const name = zip.toString('utf8', cursor + 46, cursor + 46 + nameLength);

    if (name === wantedName) {
      // Re-read the local header only for its own variable-length fields.
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const raw = zip.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(raw);
      if (method === 8) return inflateRawSync(raw);
      throw new Error(`${name}: unsupported compression method ${method}`);
    }

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`${wantedName} not found in archive`);
}

// --- parsing ----------------------------------------------------------------

/**
 * Semicolon CSV with quoted fields. ISTAT's header spreads several column names
 * across embedded newlines inside quotes, so a line-by-line split would desync
 * the whole file — this tracks quote state instead.
 */
function parseSemicolonCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ';') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * One column of one row, trimmed, empty string when absent.
 *
 * Every read below goes through this: with `noUncheckedIndexedAccess` on, a raw
 * `row[N]` is `string | undefined`, and a short row means a malformed source line
 * rather than something worth branching on at 26 separate call sites.
 */
function cell(row: string[], column: number): string {
  return row[column]?.trim() ?? '';
}

/** GeoNames files are tab-separated with no quoting at all. */
function parseTsv(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => line.split('\t'));
}

function toCsv(header: string[], rows: string[][]): string {
  const quote = (v: string): string => (/[",\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  return [header, ...rows].map((r) => r.map(quote).join(',')).join('\n') + '\n';
}

/** Equirectangular approximation. Only ever used to rank candidates, never shown. */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = aLat - bLat;
  const dLon = (aLon - bLon) * Math.cos((aLat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon) * 111.32;
}

// --- ISTAT: the comune list -------------------------------------------------

/** Column positions in Elenco-comuni-italiani.csv, verified against the header. */
const ISTAT_COLUMN = {
  regionCode: 0,
  istatCode: 4,
  /** "Denominazione (Italiana e straniera)" — slash-joined where bilingual. */
  officialName: 5,
  italianName: 6,
  regionName: 10,
  /** "Denominazione dell'Unità territoriale sovracomunale" — the province's name. */
  provinceName: 11,
  /** "Sigla automobilistica" — the two letters that appear in an address. */
  provinceCode: 14,
} as const;

interface Comune {
  istatCode: string;
  name: string;
  nameNormalised: string;
  provinceCode: string;
  regionCode: string;
}

console.log('Building the ISTAT delivery reference dataset…\n');
console.log('Sources');

const istatCsv = await fetchCached(SOURCES.comuni, 'Elenco-comuni-italiani.csv');
const postalZip = await fetchCached(SOURCES.postal, 'postal-IT.zip');
const gazetteerZip = await fetchCached(SOURCES.gazetteer, 'gazetteer-IT.zip');

const comuni = new Map<string, Comune>();
/** (normalised name, province) -> ISTAT code. The precise key. */
const byNameProvince = new Map<string, string>();
/** normalised name -> every ISTAT code using it, to find the nationally unique ones. */
const byName = new Map<string, Set<string>>();
/** normalised region name -> ISTAT region code, for reconciling with GeoNames. */
const regionCodeByName = new Map<string, string>();
/* The two tiers above the comune, collected as they go past. ISTAT repeats them on
   every comune row; there is no separate file for either, and 20 + 107 rows do not
   justify a fourth download. */
const regionNames = new Map<string, string>();
const provinceNames = new Map<string, { name: string; regionCode: string }>();

for (const row of parseSemicolonCsv(istatCsv.toString('latin1')).slice(1)) {
  const istatCode = cell(row, ISTAT_COLUMN.istatCode);
  const provinceCode = cell(row, ISTAT_COLUMN.provinceCode);
  if (!istatCode || !provinceCode) continue;

  const officialName = cell(row, ISTAT_COLUMN.officialName);
  const italianName = cell(row, ISTAT_COLUMN.italianName);
  const regionCode = cell(row, ISTAT_COLUMN.regionCode);

  comuni.set(istatCode, {
    istatCode,
    name: officialName,
    // The Italian side is what address providers return, so it is the one stored.
    nameNormalised: normaliseComuneName(italianName),
    provinceCode,
    regionCode,
  });

  const regionName = cell(row, ISTAT_COLUMN.regionName);
  if (regionName && !regionNames.has(regionCode)) regionNames.set(regionCode, regionName);
  const provinceName = cell(row, ISTAT_COLUMN.provinceName);
  if (provinceName && !provinceNames.has(provinceCode)) {
    provinceNames.set(provinceCode, { name: provinceName, regionCode });
  }

  for (const part of cell(row, ISTAT_COLUMN.regionName).split('/')) {
    const key = normaliseComuneName(part);
    if (key && !regionCodeByName.has(key)) regionCodeByName.set(key, regionCode);
  }

  for (const candidate of comuneNameCandidates(officialName, italianName)) {
    const key = `${candidate}|${provinceCode}`;
    if (!byNameProvince.has(key)) byNameProvince.set(key, istatCode);
    let codes = byName.get(candidate);
    if (!codes) byName.set(candidate, (codes = new Set()));
    codes.add(istatCode);
  }
}

// GeoNames says "Abruzzi"; ISTAT says "Abruzzo". Every other region name agrees
// once accents and the bilingual slash are handled, so this is the whole alias list.
const abruzzo = regionCodeByName.get('abruzzo');
if (abruzzo) regionCodeByName.set('abruzzi', abruzzo);

const uniqueByName = new Map<string, string>();
for (const [name, codes] of byName) {
  const only = [...codes][0];
  if (codes.size === 1 && only) uniqueByName.set(name, only);
}

console.log(`\nISTAT: ${comuni.size} comuni, ${byNameProvince.size} name+province keys`);

// --- GeoNames gazetteer: place name -> ISTAT code ---------------------------

/** Column positions in the GeoNames dump. Documented in its readme.txt. */
const GAZETTEER_COLUMN = {
  name: 1,
  asciiName: 2,
  latitude: 4,
  longitude: 5,
  featureClass: 6,
  admin1: 10,
  /** For Italy: the province's two letters. */
  admin2: 11,
  /** For Italy: the ISTAT comune code. Undocumented, so it is checked below. */
  admin3: 12,
} as const;

interface Place {
  latitude: number;
  longitude: number;
  istatCode: string;
}

const placeByNameProvince = new Map<string, string>();
const placeByName = new Map<string, Set<string>>();
/** ISTAT region code -> its places, for nearest-neighbour fallbacks. */
const placesByRegion = new Map<string, Place[]>();
/** ISTAT code -> a representative point for the comune itself. */
const pointByComune = new Map<string, Place>();
let unknownAdmin3 = 0;

for (const row of parseTsv(unzipEntry(gazetteerZip, 'IT.txt').toString('utf8'))) {
  // Feature class P is populated places: cities, towns, villages, frazioni.
  if (row.length < 15 || row[GAZETTEER_COLUMN.featureClass] !== 'P') continue;
  const istatCode = cell(row, GAZETTEER_COLUMN.admin3);
  const provinceCode = cell(row, GAZETTEER_COLUMN.admin2);
  if (!istatCode || !provinceCode) continue;
  if (!comuni.has(istatCode)) {
    unknownAdmin3 += 1;
    continue;
  }

  const comune = comuni.get(istatCode)!;
  for (const column of [GAZETTEER_COLUMN.name, GAZETTEER_COLUMN.asciiName]) {
    const name = normaliseComuneName(cell(row, column));
    if (!name) continue;
    const key = `${name}|${provinceCode}`;
    if (!placeByNameProvince.has(key)) placeByNameProvince.set(key, istatCode);
    let codes = placeByName.get(name);
    if (!codes) placeByName.set(name, (codes = new Set()));
    codes.add(istatCode);
    // A place carrying the comune's own name locates the comune itself.
    if (name === comune.nameNormalised && !pointByComune.has(istatCode)) {
      const latitude = Number(cell(row, GAZETTEER_COLUMN.latitude));
      const longitude = Number(cell(row, GAZETTEER_COLUMN.longitude));
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        pointByComune.set(istatCode, { latitude, longitude, istatCode });
      }
    }
  }

  const latitude = Number(cell(row, GAZETTEER_COLUMN.latitude));
  const longitude = Number(cell(row, GAZETTEER_COLUMN.longitude));
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const bucket = placesByRegion.get(comune.regionCode);
    const place = { latitude, longitude, istatCode };
    if (bucket) bucket.push(place);
    else placesByRegion.set(comune.regionCode, [place]);
  }
}

const uniquePlaceByName = new Map<string, string>();
for (const [name, codes] of placeByName) {
  const only = [...codes][0];
  if (codes.size === 1 && only) uniquePlaceByName.set(name, only);
}

console.log(
  `GeoNames gazetteer: ${placeByNameProvince.size} place+province keys, ` +
    `${unknownAdmin3} rows whose admin3 is not a current ISTAT code`,
);
if (unknownAdmin3 > comuni.size / 10) {
  throw new Error(
    'GeoNames admin3 no longer looks like an ISTAT comune code — the join assumption broke, ' +
      'inspect the dump before trusting this output',
  );
}

// --- GeoNames postal: CAP -> comune -----------------------------------------

/** Column positions in the GeoNames postal file. */
const POSTAL_COLUMN = {
  cap: 1,
  placeName: 2,
  regionName: 3,
  provinceCode: 6,
  latitude: 9,
  longitude: 10,
} as const;

const postalRows = parseTsv(unzipEntry(postalZip, 'IT.txt').toString('utf8'));
const allCaps = new Set(postalRows.map((row) => cell(row, POSTAL_COLUMN.cap)).filter(Boolean));

/** `${istatCode}|${cap}` — a set, because a comune repeats across many rows. */
const pairs = new Set<string>();
const tally = { nameProvince: 0, uniqueName: 0, frazioneAlreadyCovered: 0, rescued: 0, lost: 0 };
const deferred: string[][] = [];

for (const row of postalRows) {
  const cap = cell(row, POSTAL_COLUMN.cap);
  const placeName = normaliseComuneName(cell(row, POSTAL_COLUMN.placeName));
  const provinceCode = cell(row, POSTAL_COLUMN.provinceCode);
  if (!cap || !placeName) continue;

  // 1. The place names a comune in the province the postal file says. Almost all rows.
  const key = `${placeName}|${provinceCode}`;
  let istatCode = placeByNameProvince.get(key) ?? byNameProvince.get(key);
  if (istatCode) {
    tally.nameProvince += 1;
  } else {
    // 2. The name is unique in all of Italy AND lands in the region the postal file
    //    says. This is what recovers Sardinia, where GeoNames still uses the
    //    pre-2016 provinces (CA for comuni ISTAT now files under SU) — the province
    //    disagrees but the region does not. The region guard is not optional: without
    //    it, a hamlet near Rome matches a same-named comune in Piedmont.
    const regionCode = regionCodeByName.get(normaliseComuneName(cell(row, POSTAL_COLUMN.regionName)));
    const candidate = uniqueByName.get(placeName) ?? uniquePlaceByName.get(placeName);
    if (candidate && regionCode && comuni.get(candidate)?.regionCode === regionCode) {
      istatCode = candidate;
      tally.uniqueName += 1;
    }
  }

  if (istatCode) pairs.add(`${istatCode}|${cap}`);
  else deferred.push(row);
}

const cappedCaps = new Set([...pairs].map((pair) => pair.split('|')[1] ?? ''));

// 3. Whatever is left is a frazione GeoNames knows and no comune list does. If its
//    CAP is already covered, drop it — guessing a parent would only invent a
//    shared CAP and push real lookups to a coarser price. If it is the ONLY row
//    for that CAP, the CAP would otherwise resolve to nothing, so take the nearest
//    known place in the same region.
const rescues: { cap: string; place: string; comune: string; km: number }[] = [];
for (const row of deferred) {
  const cap = cell(row, POSTAL_COLUMN.cap);
  if (cappedCaps.has(cap)) {
    tally.frazioneAlreadyCovered += 1;
    continue;
  }

  const latitude = Number(cell(row, POSTAL_COLUMN.latitude));
  const longitude = Number(cell(row, POSTAL_COLUMN.longitude));
  const regionCode = regionCodeByName.get(normaliseComuneName(cell(row, POSTAL_COLUMN.regionName)));
  const candidates = regionCode ? placesByRegion.get(regionCode) : undefined;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !candidates) {
    tally.lost += 1;
    continue;
  }

  let nearest: Place | undefined;
  let nearestKm = Infinity;
  for (const place of candidates) {
    const km = distanceKm(latitude, longitude, place.latitude, place.longitude);
    if (km < nearestKm) {
      nearestKm = km;
      nearest = place;
    }
  }

  if (!nearest || nearestKm > MAX_RESCUE_KM) {
    tally.lost += 1;
    continue;
  }

  pairs.add(`${nearest.istatCode}|${cap}`);
  cappedCaps.add(cap);
  tally.rescued += 1;
  rescues.push({
    cap,
    place: cell(row, POSTAL_COLUMN.placeName),
    comune: comuni.get(nearest.istatCode)?.name ?? nearest.istatCode,
    km: Math.round(nearestKm * 10) / 10,
  });
}

// 4. The other direction: a comune with no CAP can be priced in the admin tree but
//    will never match an address, which is confusing rather than harmful. These are
//    comuni that changed province or name since GeoNames last synced. Adopt the CAP
//    of the nearest postal point, nationally — the whole problem is that the
//    province moved, so a province or region guard would rule out the right answer.
const comuniWithCap = new Set([...pairs].map((pair) => pair.split('|')[0] ?? ''));
const withoutCap = [...comuni.keys()].filter((code) => !comuniWithCap.has(code));

const postalPoints = postalRows
  .map((row) => ({
    cap: cell(row, POSTAL_COLUMN.cap),
    latitude: Number(cell(row, POSTAL_COLUMN.latitude)),
    longitude: Number(cell(row, POSTAL_COLUMN.longitude)),
  }))
  .filter((p) => p.cap && Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

const adopted: { comune: string; province: string; cap: string; km: number }[] = [];
const stillWithoutCap: Comune[] = [];
for (const code of withoutCap) {
  const comune = comuni.get(code)!;
  const point = pointByComune.get(code);
  if (!point) {
    stillWithoutCap.push(comune);
    continue;
  }

  let nearestCap: string | undefined;
  let nearestKm = Infinity;
  for (const candidate of postalPoints) {
    const km = distanceKm(point.latitude, point.longitude, candidate.latitude, candidate.longitude);
    if (km < nearestKm) {
      nearestKm = km;
      nearestCap = candidate.cap;
    }
  }

  if (!nearestCap || nearestKm > MAX_RESCUE_KM) {
    stillWithoutCap.push(comune);
    continue;
  }

  pairs.add(`${code}|${nearestCap}`);
  adopted.push({
    comune: comune.name,
    province: comune.provinceCode,
    cap: nearestCap,
    km: Math.round(nearestKm * 10) / 10,
  });
}

// --- report -----------------------------------------------------------------

const pairList = [...pairs].map((pair) => pair.split('|') as [string, string]);
const comuniByCap = new Map<string, Set<string>>();
for (const [istatCode, cap] of pairList) {
  let set = comuniByCap.get(cap);
  if (!set) comuniByCap.set(cap, (set = new Set()));
  set.add(istatCode);
}
const shared = [...comuniByCap.values()].filter((set) => set.size > 1);
const covered = new Set(pairList.map(([istatCode]) => istatCode));

console.log(`GeoNames postal: ${postalRows.length} rows, ${allCaps.size} distinct CAPs`);
console.log(`\nHow each postal row resolved`);
console.log(`  name + province                 ${tally.nameProvince}`);
console.log(`  name unique in Italy, in region ${tally.uniqueName}`);
console.log(`  frazione, CAP already covered   ${tally.frazioneAlreadyCovered} (dropped on purpose)`);
console.log(`  nearest place, CAP would be lost ${tally.rescued}`);
console.log(`  unresolved                      ${tally.lost}`);

console.log(`\nResult`);
console.log(`  comune ↔ CAP pairs              ${pairList.length}`);
console.log(
  `  CAPs resolving to a comune      ${comuniByCap.size}/${allCaps.size}` +
    `  ← the checkout depends on this being all of them`,
);
console.log(`  comuni with at least one CAP    ${covered.size}/${comuni.size}`);
console.log(
  `  CAPs shared by several comuni   ${shared.length}` +
    ` (${((shared.length / comuniByCap.size) * 100).toFixed(1)}%),` +
    ` worst ${Math.max(...shared.map((s) => s.size))} comuni on one CAP`,
);

if (rescues.length > 0) {
  console.log(`\n${rescues.length} CAPs kept alive by their nearest known place:`);
  for (const r of rescues.slice(0, 40)) {
    console.log(`  ${r.cap}  ${r.place} → ${r.comune} (${r.km} km)`);
  }
  if (rescues.length > 40) console.log(`  … and ${rescues.length - 40} more`);
}

if (adopted.length > 0) {
  console.log(`\n${adopted.length} comuni given their nearest CAP (province or name changed since`);
  console.log(`GeoNames last synced — check these against Poste if a customer reports a bad fee):`);
  for (const a of adopted) {
    console.log(`  ${a.comune} (${a.province}) → ${a.cap} (${a.km} km)`);
  }
}

if (stillWithoutCap.length > 0) {
  console.log(`\n${stillWithoutCap.length} comuni still with no CAP — reachable only by province:`);
  for (const c of stillWithoutCap) console.log(`  ${c.istatCode} ${c.name} (${c.provinceCode})`);
}

if (comuniByCap.size < allCaps.size) {
  const orphans = [...allCaps].filter((cap) => !comuniByCap.has(cap!));
  console.log(`\n${orphans.length} CAPs resolve to NOTHING and will fall back to the country row:`);
  console.log(`  ${orphans.join(' ')}`);
}

// --- write ------------------------------------------------------------------

const comuneRows = [...comuni.values()]
  .sort((a, b) => a.istatCode.localeCompare(b.istatCode))
  .map((c) => [c.istatCode, c.name, c.nameNormalised, c.provinceCode, c.regionCode]);

const capRows = pairList
  .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
  .map(([istatCode, cap]) => [istatCode, cap]);

const regionRows = [...regionNames.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, name]) => [code, name]);

const provinceRows = [...provinceNames.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, { name, regionCode }]) => [code, name, regionCode]);

mkdirSync(dirname(istatComuniCsvPath), { recursive: true });
writeFileSync(istatRegionsCsvPath, toCsv(['region_code', 'name'], regionRows));
writeFileSync(
  istatProvincesCsvPath,
  toCsv(['province_code', 'name', 'region_code'], provinceRows),
);
writeFileSync(
  istatComuniCsvPath,
  toCsv(['istat_code', 'name', 'name_normalised', 'province_code', 'region_code'], comuneRows),
);
writeFileSync(istatComuneCapsCsvPath, toCsv(['istat_code', 'cap'], capRows));

console.log(`\nWrote`);
console.log(`  ${istatRegionsCsvPath}  (${regionRows.length} rows)`);
console.log(`  ${istatProvincesCsvPath}  (${provinceRows.length} rows)`);
console.log(`  ${istatComuniCsvPath}  (${comuneRows.length} rows)`);
console.log(`  ${istatComuneCapsCsvPath}  (${capRows.length} rows)`);
console.log(`\nCommit both. Then: pnpm --filter @mia/server seed`);

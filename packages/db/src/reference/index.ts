import { fileURLToPath } from 'node:url';

/**
 * Where the committed reference datasets live.
 *
 * `packages/db/data/` holds CSVs produced by
 * `apps/server/script/build-istat-dataset.ts` and checked into git on purpose:
 * the seed must work with no network, and a deploy must load exactly the rows a
 * developer reviewed rather than whatever the upstream sources say today.
 *
 * Resolved from `import.meta.url` so it survives being imported from a script in
 * another workspace package, where a relative path would not.
 */
const dataDir = new URL('../../data/', import.meta.url);

/**
 * The two tiers above the comune, as names rather than the bare codes ISTAT puts
 * on every comune row: `12` is Lazio, `RM` is Roma. 20 and 107 rows.
 */
export const istatRegionsCsvPath = fileURLToPath(new URL('istat-regions.csv', dataDir));
export const istatProvincesCsvPath = fileURLToPath(new URL('istat-provinces.csv', dataDir));

/** One row per comune: `istat_code,name,name_normalised,province_code,region_code`. */
export const istatComuniCsvPath = fileURLToPath(new URL('istat-comuni.csv', dataDir));

/** The CAP junction: `istat_code,cap`. */
export const istatComuneCapsCsvPath = fileURLToPath(new URL('istat-comune-caps.csv', dataDir));

/**
 * Reads one of the CSVs above.
 *
 * Deliberately tiny rather than a CSV library: this parser only ever sees files
 * this repo generated, and the generator quotes with the same rules. It handles
 * quoted fields, doubled quotes inside them, and CRLF — nothing else, because
 * nothing else can appear.
 */
export function parseReferenceCsv(text: string): string[][] {
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
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
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

  // Drop the header and any trailing blank line.
  return rows.slice(1).filter((r) => r.length > 1 || r[0] !== '');
}

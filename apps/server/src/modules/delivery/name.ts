/**
 * Comune-name normalisation.
 *
 * There is exactly one of these on purpose. `istat_comuni.name_normalised` is
 * written by `script/build-istat-dataset.ts` and read by the quote resolver, so
 * if the two ever normalised differently every lookup would silently miss and
 * every customer would quietly get a coarser price. Both import this.
 *
 * Changing it means re-running the dataset script — the stored column has to be
 * rebuilt with the new rule.
 */

/**
 * Case-folds, strips accents, and flattens the punctuation Italian place names
 * disagree about between sources:
 *
 *   "Reggio nell'Emilia"        -> "reggio nell emilia"
 *   "SANT'AGATA DE' GOTI"       -> "sant agata de goti"
 *   "Roccafluvione"             -> "roccafluvione"
 *   "Vo'"                       -> "vo"
 *
 * Apostrophes, hyphens and dots all become spaces rather than vanishing, because
 * sources differ on whether they separate words: one writes "Sant'Angelo", another
 * "Sant Angelo", a third "Santangelo". Collapsing to a space matches the first
 * two; the third is a genuine miss and shows up in the import report.
 */
export function normaliseComuneName(value: string): string {
  return value
    .normalize('NFKD')
    // Combining marks, once NFKD has split them off the base letter.
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[’'`´\-–—.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ISTAT gives bilingual comuni one slash-joined denomination — "Bolzano/Bozen",
 * "Brixen/Bressanone". Providers return one side or the other, so the importer
 * needs every side as a match candidate.
 */
export function comuneNameCandidates(officialName: string, italianName: string): string[] {
  const parts = [officialName, italianName, ...officialName.split('/')];
  const seen = new Set<string>();
  for (const part of parts) {
    const normalised = normaliseComuneName(part);
    if (normalised) seen.add(normalised);
  }
  return [...seen];
}

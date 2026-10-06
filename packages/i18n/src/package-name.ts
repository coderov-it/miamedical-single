import type { LanguageCode, RentalUnit } from '@mia/validators';
import { type Localized, SOURCE_LANGUAGE } from '@mia/validators/language';

import { durationLabel } from './enum-labels.ts';

/**
 * The name a rental package is shown under, in one language — ONE source, so a
 * page never stacks the Italian name over its translated duration:
 *
 *   { it: '7 giorni' }                     , 'it' → "7 giorni"
 *   { it: '7 giorni' }                     , 'en' → "7 days"     (no English name: the duration, in English)
 *   { it: 'Weekend', en: 'Weekend break' } , 'en' → "Weekend break"
 *
 * The usual content fallback (the source language) is wrong here: a package
 * name is almost always just its duration, which every locale can already say.
 */
export function rentalPackageName(
  pkg: { name: Localized; duration: number; unit: RentalUnit },
  locale: LanguageCode,
): string {
  const own = (pkg.name as Partial<Record<LanguageCode, string>>)[locale]?.trim();
  if (own) return own;
  if (locale === SOURCE_LANGUAGE) return pkg.name[SOURCE_LANGUAGE];
  return durationLabel(pkg.duration, pkg.unit, locale);
}

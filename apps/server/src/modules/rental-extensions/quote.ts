import { pickLocalized, type LanguageCode } from '@mia/db/schema';
import { addMoney, mulMoney } from '@mia/pricing';

import type { ExtensionOption, LineAmounts, RentalLine } from './types.ts';

const DAY_MS = 86_400_000;

/** `2026-10-08` + 7 → `2026-10-15`, in UTC so a DST day is still one day. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The day the order currently comes back: the latest end across its rental lines. */
export function currentEndDate(lines: readonly RentalLine[]): string | null {
  let latest: string | null = null;
  for (const line of lines) {
    if (line.endDate && (latest === null || line.endDate > latest)) latest = line.endDate;
  }
  return latest;
}

/**
 * The lengths this order can be extended by, and what each costs.
 *
 * A length is offered when EVERY rental line's product sells a day package of
 * that duration — one extension covers the whole order, like its contract does.
 * The price is each line's package × its quantity; add-ons are not re-billed.
 *
 *   line A: wheelchair ×1  packages 7g €70, 30g €200
 *   line B: cushion    ×2  packages 7g €10, 14g €18
 *   → offered: 7 days = 70 + 2×10 = €90        (30 and 14 are not shared)
 */
export function extensionOptions(
  lines: readonly RentalLine[],
  fromDate: string,
  locale: LanguageCode,
): ExtensionOption[] {
  const [first, ...rest] = lines;
  if (!first) return [];

  const options: ExtensionOption[] = [];
  for (const pkg of first.packages) {
    if (pkg.unit !== 'day') continue;
    const lineAmounts: LineAmounts = {};
    let amount = '0.00';
    let everyLine = true;
    for (const line of [first, ...rest]) {
      const match = line.packages.find((p) => p.unit === 'day' && p.duration === pkg.duration);
      if (!match) {
        everyLine = false;
        break;
      }
      const lineAmount = mulMoney(match.price, line.quantity);
      lineAmounts[line.id] = { unitPrice: match.price, total: lineAmount };
      amount = addMoney(amount, lineAmount);
    }
    if (!everyLine) continue;
    if (options.some((option) => option.days === pkg.duration)) continue;
    options.push({
      days: pkg.duration,
      label: pickLocalized(pkg.name, locale),
      amount,
      lineAmounts,
      fromDate,
      toDate: addDays(fromDate, pkg.duration),
    });
  }
  return options.sort((a, b) => a.days - b.days);
}

/**
 * Splits an operator-typed amount over the lines for the contract table: the
 * whole figure on the first line, nothing on the rest. The contract total is
 * what was agreed; a per-line split nobody agreed to would be invented.
 */
export function manualLineAmounts(lines: readonly RentalLine[], amount: string): LineAmounts {
  return Object.fromEntries(
    lines.map((line, index) => {
      const total = index === 0 ? amount : '0.00';
      return [line.id, { unitPrice: total, total }];
    }),
  );
}

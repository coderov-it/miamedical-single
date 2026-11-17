import { languageOf } from '~/lib/i18n/languages';
import { uiLang } from '~/lib/ui-lang.svelte';

/** The interface language's locale tag, read per call so a language switch re-renders. */
export function locale(): string {
  return languageOf(uiLang.current).tag;
}

/** `+12.5%` magnitude without the sign — the arrow carries the direction. */
export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(Math.abs(value))}%`;
}

/** Axis ticks: `12 k €`, `1,2 M €`. */
export function compactMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

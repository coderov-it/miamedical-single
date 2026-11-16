export function toCents(amount: string): number {
  const [whole = '0', frac = ''] = amount.split('.');
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0').slice(0, 2));
  return Number.isFinite(cents) ? cents : 0;
}

export function fromCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

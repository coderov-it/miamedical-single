/**
 * The order panel's DISPLAY ESTIMATE: the form, mirrored into the panel.
 *
 * It mirrors `priceRequest` in `@mia/pricing` and is authoritative over nothing.
 * A RENTAL IS ITS PACKAGE — the package price is the whole rate, and a
 * rental-mode add-on multiplies by the package's duration read in the add-on's
 * own unit. With no package there is nothing to price, so the panel shows a dash.
 *
 * It also owns the two reveals that follow from the chosen package: the start-time
 * row, which only an hourly package needs, and each add-on's quantity stepper.
 */
import { type PdpLabels, unitWord } from './labels.ts';
import { type ChosenPackage, convertDuration, derivePeriod, readChosenPackage } from './rental.ts';

interface EstimateLine {
  label: string;
  amount: string;
}

export interface Estimate {
  /** Recomputes everything from the form's current state. */
  update: () => void;
  /** The chosen package, for the calendar's shaded span. */
  chosenPackage: () => ChosenPackage | null;
}

/**
 * Each add-on's quantity stepper: revealed with its tick, and DISABLED without
 * it.
 *
 * `hidden` still submits — only `disabled` suppresses a field — and the cart
 * stores this query string, so an untouched extra would otherwise leave a stray
 * `addon.<id>=1` in `localStorage` for as long as the line lives.
 *
 * IT RUNS ON EVERY UPDATE, unconditionally, and that is a fix rather than a
 * tidy-up: this used to sit inside the priced branch, which a rental does not
 * reach until a package is chosen. Every multi-quantity add-on on every rental
 * therefore shipped its stepper enabled and hidden, and the quantity of an extra
 * nobody ticked went into the request.
 */
function syncAddonSteppers(form: HTMLFormElement): Map<string, HTMLInputElement> {
  const steppers = new Map<string, HTMLInputElement>();

  for (const input of form.querySelectorAll<HTMLInputElement>('[data-est-kind="addon"]')) {
    const id = input.dataset.addonId ?? '';
    const row = form.querySelector<HTMLElement>(`[data-addon-qty-row="${id}"]`);
    const stepper = form.querySelector<HTMLInputElement>(`[data-est-addon-qty="${id}"]`);
    if (row) row.hidden = !input.checked;
    if (stepper) {
      stepper.disabled = !input.checked;
      steppers.set(id, stepper);
    }
  }

  return steppers;
}

export function createEstimate(form: HTMLFormElement, labels: PdpLabels): Estimate {
  const config = form.dataset;
  const base = Number(config.estBase ?? '0');
  const isRental = config.estMode === 'rental';
  const money = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: config.estCurrency || 'EUR',
  });
  /* Shared with the calendar, which prints the same dates in its own trigger —
     two formats for one date would read as two dates. */
  const dateFormat = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const totalSlot = document.querySelector('[data-est-total]');
  const noteSlot = document.querySelector('[data-est-note]');
  const linesSlot = document.querySelector('[data-est-lines]');
  const packageTitle = document.querySelector('[data-pkg-title]');
  const periodRow = document.querySelector<HTMLElement>('[data-period-row]');
  const periodEnd = document.querySelector('[data-cal-end]');

  const startInput = form.querySelector<HTMLInputElement>('[data-est-start]');
  const timeInput = form.querySelector<HTMLInputElement>('[data-est-time]');
  const timeRow = form.querySelector<HTMLElement>('[data-time-row]');
  const quantityInput = form.querySelector<HTMLInputElement>('[data-est-qty]');

  /** What the ticked add-ons add to the total, and the lines that say so. */
  function collectAddons(
    pkg: ChosenPackage | null,
    steppers: Map<string, HTMLInputElement>,
    lines: EstimateLine[],
  ): number {
    let total = 0;

    for (const input of form.querySelectorAll<HTMLInputElement>('[data-est-kind="addon"]')) {
      if (!input.checked) continue;
      const stepper = steppers.get(input.dataset.addonId ?? '');

      const price = Number(input.dataset.estPrice ?? '0');
      const label = input.dataset.estLabel ?? labels.extra;
      const quantity = Math.max(1, Number(stepper?.value) || 1);

      if (price === 0) {
        lines.push({ label, amount: labels.included });
        continue;
      }

      const perRental = pkg !== null && input.dataset.estMode === 'rental';
      const billed = perRental
        ? convertDuration(pkg.duration, pkg.unit, input.dataset.estUnit || pkg.unit)
        : 1;
      const amount = price * quantity * billed;
      total += amount;

      const parts = [label];
      if (quantity > 1) parts.push(`× ${quantity}`);
      if (perRental) {
        parts.push(`× ${billed} ${unitWord(labels, billed, input.dataset.estUnit || pkg.unit)}`);
      }
      lines.push({ label: parts.join(' '), amount: money.format(amount) });
    }

    return total;
  }

  /**
   * The return date is the overview's FIRST row, not a sub-line of the date
   * field: the customer did not enter it, the package derived it. The row is
   * absent until both halves of that derivation exist.
   */
  function paintPeriod(pkg: ChosenPackage | null): void {
    if (!periodRow || !periodEnd) return;
    const period =
      pkg && startInput?.value
        ? derivePeriod(startInput.value, timeInput?.value ?? '', pkg.unit, pkg.duration)
        : null;
    periodRow.hidden = period === null;
    periodEnd.textContent = period ? dateFormat.format(new Date(`${period.endDate}T12:00`)) : '';
  }

  function paintLines(lines: EstimateLine[]): void {
    if (!linesSlot) return;
    linesSlot.replaceChildren(
      ...lines.map((line) => {
        const row = document.createElement('li');
        row.className = 'flex justify-between gap-3';
        const label = document.createElement('span');
        label.className = 'text-ink-2 min-w-0';
        label.textContent = line.label;
        const amount = document.createElement('span');
        amount.className = 'font-semibold whitespace-nowrap tabular-nums';
        amount.textContent = line.amount;
        row.append(label, amount);
        return row;
      }),
    );
  }

  function update(): void {
    const pkg = readChosenPackage(form);
    /* Before the price branch, never inside it — see `syncAddonSteppers`. */
    const steppers = syncAddonSteppers(form);

    // An hourly package is the only case that needs a time of day.
    if (timeRow) timeRow.hidden = !pkg || pkg.unit !== 'hour';

    const quantity = Math.max(
      1,
      Math.min(Number(quantityInput?.value) || 1, Number(quantityInput?.max) || 10),
    );
    const lines: EstimateLine[] = [];
    /* Nothing to quote until a rental has its package — see the module note. */
    const incomplete = isRental && !pkg;
    let total = 0;

    if (!incomplete) {
      total = pkg ? pkg.price : base;

      if (pkg) {
        lines.push({ label: pkg.detail, amount: money.format(pkg.price) });
      } else {
        lines.push({ label: labels.baseRate, amount: money.format(total) });
      }

      total += collectAddons(pkg, steppers, lines);
      total *= quantity;
      if (quantity > 1) lines.push({ label: labels.quantity, amount: `× ${quantity}` });
    }

    if (totalSlot) totalSlot.textContent = incomplete ? '—' : money.format(total);
    if (noteSlot) noteSlot.textContent = noteFor(pkg);
    // The disclosure is collapsed most of the time, so the field has to say what
    // is chosen.
    if (packageTitle) packageTitle.textContent = pkg ? pkg.label : labels.choosePackage;

    paintPeriod(pkg);
    paintLines(lines);
  }

  function noteFor(pkg: ChosenPackage | null): string {
    if (!isRental) return labels.productPrice;
    if (!pkg) return labels.choosePackageNote;
    return labels.packageNote.replace('{name}', pkg.label);
  }

  return { update, chosenPackage: () => readChosenPackage(form) };
}

/**
 * The order panel's start-date calendar — the reference design's control, as a
 * popover over a month grid.
 *
 * IT NEVER OWNS THE VALUE. Every click writes through the native
 * `<input type="date">` and dispatches `change`, so the estimate, the derived
 * return and the form gate all keep working without knowing this exists. That is
 * also what makes the no-JavaScript path whole: the native row IS the control
 * until this mounts, and `mount()` returns false without touching the page if
 * any part of the markup is missing.
 *
 * ONE DATE to pick, so there is no range state here. The package decides the
 * end; the grid only shades the span it implies.
 */
import type { PdpLabels } from './labels.ts';
import { checkedPackageInput, derivePeriod, fromIsoDate, toIsoDate } from './rental.ts';

/** How many cells a month grid always draws: six weeks, Monday-first. */
const GRID_CELLS = 42;

export interface CalendarOptions {
  form: HTMLFormElement;
  labels: PdpLabels;
  /** Called after the value changes, so the panel can re-mirror the form. */
  onChange: () => void;
}

export interface Calendar {
  /** Redraws the grid — the shaded span moves when the package does. */
  paint: () => void;
}

/**
 * Mounts the calendar over the native date row, or returns null and leaves the
 * page exactly as the server rendered it.
 */
export function mountCalendar(options: CalendarOptions): Calendar | null {
  const { form, labels, onChange } = options;

  const block = document.querySelector<HTMLElement>('[data-date-block]');
  const native = block?.querySelector<HTMLElement>('[data-date-native]');
  const enhanced = block?.querySelector<HTMLElement>('[data-cal-block]');
  const trigger = block?.querySelector<HTMLButtonElement>('[data-cal-trigger]');
  const popover = block?.querySelector<HTMLElement>('[data-cal-pop]');
  const grid = block?.querySelector<HTMLElement>('[data-cal-grid]');
  const startInput = form.querySelector<HTMLInputElement>('[data-est-start]');
  const timeInput = form.querySelector<HTMLInputElement>('[data-est-time]');

  if (!block || !native || !enhanced || !trigger || !popover || !grid || !startInput) return null;

  /* The day-cell class list lives on the server so this never hard-codes a
     design token; the template carries it and the grid copies it 42 times. */
  const cellClass =
    block.querySelector<HTMLElement>('[data-cal-cell-class]')?.dataset.calCellClass ?? '';
  const titleSlot = block.querySelector('[data-cal-title]');
  const valueSlot = block.querySelector('[data-cal-start]');

  const dayFormat = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const monthFormat = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });
  const fullFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'full' });

  const floor = startInput.min || toIsoDate(new Date());
  let cursor = fromIsoDate(startInput.value || floor);
  cursor.setDate(1);

  /** The end the current package derives, so the grid can shade the span. */
  function derivedEnd(): string {
    const pkg = checkedPackageInput(form);
    if (!pkg || !startInput!.value) return '';
    const period = derivePeriod(
      startInput!.value,
      timeInput?.value ?? '',
      pkg.dataset.estUnit ?? 'day',
      Number(pkg.dataset.estDuration ?? '0'),
    );
    return period?.endDate ?? '';
  }

  function buildCell(day: Date, start: string, end: string): HTMLButtonElement {
    const iso = toIsoDate(day);
    const cell = document.createElement('button');
    cell.type = 'button'; // inside a form, the default would submit it
    cell.className = cellClass;
    cell.textContent = String(day.getDate());
    cell.dataset.iso = iso;

    if (iso < floor) cell.disabled = true;
    if (day.getMonth() !== cursor.getMonth()) cell.dataset.out = '';
    if (iso === start || (end && iso === end)) cell.dataset.edge = '';
    else if (start && end && iso > start && iso < end) cell.dataset.range = '';

    cell.setAttribute('aria-label', fullFormat.format(day));
    if (iso === start || iso === end) cell.setAttribute('aria-current', 'date');
    return cell;
  }

  function paint(): void {
    const start = startInput!.value;
    const end = derivedEnd();

    if (titleSlot) {
      const title = monthFormat.format(cursor);
      titleSlot.textContent = title.charAt(0).toUpperCase() + title.slice(1);
    }
    if (valueSlot) {
      valueSlot.textContent = start ? dayFormat.format(fromIsoDate(start)) : labels.chooseDate;
    }

    // Monday-first: JS getDay() is Sunday-first, so rotate by 6 mod 7.
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;

    const cells: HTMLButtonElement[] = [];
    for (let index = 0; index < GRID_CELLS; index++) {
      const day = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - lead + index);
      cells.push(buildCell(day, start, end));
    }
    grid!.replaceChildren(...cells);
  }

  // One date to pick, so a click always sets the start.
  function choose(iso: string): void {
    startInput!.value = iso;
    startInput!.dispatchEvent(new Event('change', { bubbles: true }));
    onChange();
    paint();
  }

  function setOpen(open: boolean): void {
    popover!.hidden = !open;
    trigger!.setAttribute('aria-expanded', String(open));
    if (open) paint();
  }

  grid.addEventListener('click', (event) => {
    const cell = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-iso]');
    if (cell && !cell.disabled) choose(cell.dataset.iso!);
  });

  function shiftMonth(months: number): void {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + months, 1);
    paint();
  }

  block.querySelector('[data-cal-prev]')?.addEventListener('click', () => shiftMonth(-1));
  block.querySelector('[data-cal-next]')?.addEventListener('click', () => shiftMonth(1));
  block.querySelector('[data-cal-done]')?.addEventListener('click', () => {
    setOpen(false);
    trigger.focus();
  });
  trigger.addEventListener('click', () => setOpen(popover.hidden !== false));

  document.addEventListener('click', (event) => {
    if (!popover.hidden && !block.contains(event.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popover.hidden) {
      setOpen(false);
      trigger.focus();
    }
  });

  // Only now is the enhanced control real — swap it in.
  native.hidden = true;
  enhanced.hidden = false;
  paint();

  return { paint };
}

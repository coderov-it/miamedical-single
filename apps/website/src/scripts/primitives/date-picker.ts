import 'cally';
import { documentLocale } from '../locale';
import { createSurface } from './surface';

type CalendarElement = HTMLElement & {
  value: string;
  min: string;
  max: string;
  focus: (options?: FocusOptions & { target?: 'day' | 'next' | 'previous' }) => void;
};

const DISPLAY_FORMAT = new Intl.DateTimeFormat(documentLocale(), {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Progressive enhancement for every `DatePicker.astro` instance on the page. */
export async function mountDatePickers(root: ParentNode = document): Promise<void> {
  await customElements.whenDefined('calendar-date');
  const pickers = root.querySelectorAll<HTMLElement>('[data-core-date-picker]:not([data-ready])');

  for (const picker of pickers) mountDatePicker(picker);
}

function mountDatePicker(picker: HTMLElement): void {
  const label = picker.querySelector<HTMLLabelElement>('.core-date-label');
  const input = picker.querySelector<HTMLInputElement>('[data-date-native]');
  const trigger = picker.querySelector<HTMLButtonElement>('[data-date-trigger]');
  const popover = picker.querySelector<HTMLElement>('[data-date-popover]');
  const value = picker.querySelector<HTMLElement>('[data-date-value]');
  const calendar = picker.querySelector<CalendarElement>('[data-date-calendar]');

  if (!label || !input || !trigger || !popover || !value || !calendar) return;

  const configuredMin = picker.dataset.min;
  const min = configuredMin === 'today' ? toIsoDate(new Date()) : (configuredMin ?? '');
  const max = picker.dataset.max ?? '';
  const placeholder = value.dataset.placeholder ?? '';
  const floating = createSurface(trigger, popover, { phoneSheet: true });

  input.min = min;
  input.max = max;
  calendar.min = min;
  calendar.max = max;
  calendar.value = input.value;

  function sync(): void {
    calendar!.value = input!.value;
    value!.textContent = input!.value
      ? DISPLAY_FORMAT.format(fromIsoDate(input!.value))
      : placeholder;
    value!.classList.toggle('is-empty', input!.value === '');
  }

  function setOpen(open: boolean): void {
    popover!.hidden = !open;
    trigger!.setAttribute('aria-expanded', String(open));
    if (!open) {
      floating.stop();
      return;
    }
    floating.start();
    window.setTimeout(() => calendar!.focus({ target: 'day' }));
  }

  function close(restoreFocus: boolean): void {
    setOpen(false);
    if (restoreFocus) trigger!.focus();
  }

  trigger.addEventListener('click', () => setOpen(popover.hidden !== false));
  picker.querySelector('[data-date-close]')?.addEventListener('click', () => close(true));
  input.addEventListener('change', sync);
  input.form?.addEventListener('reset', () => window.setTimeout(sync));
  calendar.addEventListener('change', () => {
    input.value = calendar.value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
    close(true);
  });

  document.addEventListener('click', (event) => {
    if (!popover.hidden && !picker.contains(event.target as Node)) close(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popover.hidden) close(true);
  });

  label.htmlFor = trigger.id;
  input.hidden = true;
  trigger.hidden = false;
  picker.dataset.ready = '';
  sync();
}

import { createFloating } from './floating';

/** Progressive enhancement for every `Dropdown.astro` instance on the page. */
export function mountDropdowns(root: ParentNode = document): void {
  const dropdowns = root.querySelectorAll<HTMLElement>('[data-core-dropdown]:not([data-ready])');

  for (const dropdown of dropdowns) mountDropdown(dropdown);
}

function mountDropdown(dropdown: HTMLElement): void {
  const label = dropdown.querySelector<HTMLLabelElement>('.core-dropdown-label');
  const select = dropdown.querySelector<HTMLSelectElement>('[data-dropdown-native]');
  const trigger = dropdown.querySelector<HTMLButtonElement>('[data-dropdown-trigger]');
  const popover = dropdown.querySelector<HTMLElement>('[data-dropdown-popover]');
  const value = dropdown.querySelector<HTMLElement>('[data-dropdown-value]');

  if (!label || !select || !trigger || !popover || !value) return;

  const options = [...popover.querySelectorAll<HTMLButtonElement>('[role="option"]')];
  const floating = createFloating(trigger, popover, { matchReferenceWidth: true });

  function sync(): void {
    const selected = options.find((option) => option.dataset.value === select!.value);
    if (!selected) {
      value!.textContent = value!.dataset.placeholder ?? '';
      value!.classList.add('is-empty');
      return;
    }
    value!.textContent = selected.textContent?.trim() ?? '';
    value!.classList.toggle('is-empty', select!.value === '');
    for (const option of options) {
      option.setAttribute('aria-selected', String(option === selected));
    }
  }

  function setOpen(open: boolean): void {
    popover!.hidden = !open;
    trigger!.setAttribute('aria-expanded', String(open));
    if (!open) {
      floating.stop();
      return;
    }
    floating.start();
    const selected = options.find((option) => option.getAttribute('aria-selected') === 'true');
    (selected ?? options[0])?.focus();
  }

  function close(restoreFocus: boolean): void {
    setOpen(false);
    if (restoreFocus) trigger!.focus();
  }

  function choose(option: HTMLButtonElement): void {
    select!.value = option.dataset.value ?? '';
    select!.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
    close(true);
  }

  options.forEach((option, index) => {
    option.addEventListener('click', () => choose(option));
    option.addEventListener('keydown', (event) => {
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      options[(index + step + options.length) % options.length]?.focus();
    });
  });

  trigger.addEventListener('click', () => setOpen(popover.hidden !== false));
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setOpen(true);
  });
  select.addEventListener('change', sync);
  select.form?.addEventListener('reset', () => window.setTimeout(sync));

  document.addEventListener('click', (event) => {
    if (!popover.hidden && !dropdown.contains(event.target as Node)) close(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popover.hidden) close(true);
  });

  label.htmlFor = trigger.id;
  select.hidden = true;
  trigger.hidden = false;
  dropdown.dataset.ready = '';
  sync();
}

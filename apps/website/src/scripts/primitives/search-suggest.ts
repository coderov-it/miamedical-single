/**
 * Progressive enhancement for `SearchSuggest.astro`: the typed-ahead list under
 * the search field.
 *
 * THE FIELD WORKS BEFORE THIS RUNS. It is a real `<input name="q">` in a native
 * GET form, so with no JavaScript, a failed chunk or a slow connection the
 * customer types and submits and lands on the search page. Everything here is
 * addition — nothing is disabled waiting for it, and nothing routes through it.
 *
 * It is a full ARIA 1.2 combobox, keyboard included. The reference site ships
 * the same attributes with no key handling at all, so its list can only be
 * reached with a mouse; ours answers ArrowDown/ArrowUp/Home/End/Enter/Escape,
 * which is the difference between a control and a picture of one.
 *
 * `aria-activedescendant` moves the screen reader's cursor while DOM focus
 * stays in the input — the pattern's whole point, since the customer is still
 * typing. That is also why rows are `<a>`: a suggestion is a destination, so it
 * opens in a new tab on a middle click and offers a real context menu, while
 * `role="option"` keeps assistive tech reading it as part of the list.
 */

/** One row as the server sends it. */
interface SuggestItem {
  label: string;
  href: string;
  meta: string;
}

/** The same row with the match key derived — built once, at mount. */
interface IndexedItem extends SuggestItem {
  key: string;
}

/** Below this a query matches most of the catalogue, which is not a suggestion. */
const MIN_QUERY = 2;
/** The reference's own ceiling, and about what fits without becoming a page. */
const MAX_ITEMS = 7;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * EVERY WORD TYPED HAS TO APPEAR, in any order. Matching the raw string would
 * make "letto elettrico" find only titles carrying those two words adjacent and
 * in that order, which is not how anyone describes what they need — the shop
 * calls the same product "Letto Ortopedico Elettrico". Splitting on whitespace
 * costs nothing and turns the field from a prefix box into a search.
 *
 * The score is the best position the FIRST word reaches: at the start of the
 * label reads as "what I typed", at a word boundary nearly so, and inside a
 * word as a coincidence — which is why the third sorts last rather than not
 * matching at all. The index's own order (categories, then catalogue order)
 * breaks every remaining tie, and the sort is stable, so "carrozzine" keeps the
 * category above the products whose names merely contain the word.
 */
function positionScore(key: string, at: number): number {
  if (at === 0) return 0;
  if (key[at - 1] === ' ') return 1;
  return 2;
}

function rank(items: IndexedItem[], words: string[]): IndexedItem[] {
  const scored: { item: IndexedItem; score: number }[] = [];

  for (const item of items) {
    const first = item.key.indexOf(words[0] ?? '');
    if (first === -1) continue;
    if (!words.every((word) => item.key.includes(word))) continue;
    scored.push({ item, score: positionScore(item.key, first) });
  }

  return scored
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, MAX_ITEMS)
    .map((entry) => entry.item);
}

export function mountSearchSuggest(root: ParentNode = document): void {
  const fields = root.querySelectorAll<HTMLElement>('[data-search-suggest]:not([data-ready])');
  for (const field of fields) mountOne(field);
}

function mountOne(field: HTMLElement): void {
  const input = field.querySelector<HTMLInputElement>('[data-suggest-input]');
  const listbox = field.querySelector<HTMLElement>('[data-suggest-listbox]');
  const source = field.querySelector<HTMLScriptElement>('[data-suggest-index]');
  if (!input || !listbox || !source) return;

  let items: IndexedItem[] = [];
  try {
    const raw = JSON.parse(source.textContent ?? '[]') as SuggestItem[];
    /* `normalize` is the matcher's own rule, so the key and the query can never
       be normalised two different ways. */
    items = raw.map((item) => ({ ...item, key: normalize(item.label) }));
  } catch {
    /* A malformed index is not worth breaking the field over — the form still
       submits, which is the behaviour with no script at all. */
    return;
  }
  if (items.length === 0) return;

  field.dataset.ready = 'true';

  const listboxId = listbox.id;
  let shown: IndexedItem[] = [];
  let active = -1;

  function paintActive(): void {
    const rows = [...listbox!.querySelectorAll<HTMLElement>('[role="option"]')];
    rows.forEach((row, index) => {
      const on = index === active;
      row.setAttribute('aria-selected', String(on));
      row.classList.toggle('bg-accent-tint', on);
    });
    const current = rows[active];
    if (current) {
      input!.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
      return;
    }
    input!.removeAttribute('aria-activedescendant');
  }

  function close(): void {
    /* Emptied, not just hidden: a closed list holding the previous query's rows
       is state waiting to be shown by mistake. */
    listbox!.replaceChildren();
    listbox!.hidden = true;
    input!.setAttribute('aria-expanded', 'false');
    input!.removeAttribute('aria-activedescendant');
    active = -1;
    shown = [];
  }

  function open(matches: IndexedItem[]): void {
    shown = matches;
    active = -1;
    listbox!.replaceChildren(
      ...matches.map((item, index) => {
        const row = document.createElement('a');
        row.id = `${listboxId}-o${index}`;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', 'false');
        row.href = item.href;
        row.className =
          'flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5 no-underline ' +
          'hover:bg-accent-tint';

        const label = document.createElement('span');
        label.className = 'font-ui text-ink min-w-0 truncate text-[1.0313rem] font-semibold';
        label.textContent = item.label;

        const meta = document.createElement('span');
        meta.className = 'text-ink-2 flex-none text-base tabular-nums';
        meta.textContent = item.meta;

        row.append(label, meta);
        /* Pointer, not focus: DOM focus must stay in the input while the
           customer is still typing, so hovering only moves the marker. */
        row.addEventListener('pointermove', () => {
          active = index;
          paintActive();
        });
        return row;
      }),
    );
    listbox!.hidden = false;
    input!.setAttribute('aria-expanded', 'true');
  }

  function refresh(): void {
    const query = normalize(input!.value);
    if (query.length < MIN_QUERY) {
      close();
      return;
    }
    const words = query.split(/\s+/).filter(Boolean);
    const matches = rank(items, words);
    if (matches.length === 0) {
      close();
      return;
    }
    open(matches);
  }

  function move(delta: number): void {
    if (listbox!.hidden) {
      refresh();
      if (listbox!.hidden) return;
    }
    /* Slot 0 is "nothing selected" and slots 1..n are the options, so the
       cycle hands the customer their own typed query back when they arrow past
       either end rather than trapping them in the list. */
    const slots = shown.length + 1;
    active = ((active + 1 + delta + slots) % slots) - 1;
    paintActive();
  }

  input.addEventListener('input', refresh);
  input.addEventListener('focus', refresh);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === 'Escape') {
      if (!listbox.hidden) event.preventDefault();
      close();
      return;
    }
    if (listbox.hidden) return;
    if (event.key === 'Home') {
      event.preventDefault();
      active = 0;
      paintActive();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      active = shown.length - 1;
      paintActive();
      return;
    }
    if (event.key === 'Enter' && active >= 0) {
      /* Only when a suggestion is marked. With none, Enter is the form's own
         submit and the customer gets the search page for what they typed. */
      const target = shown[active];
      if (target) {
        event.preventDefault();
        window.location.href = target.href;
      }
    }
  });

  /* `pointerdown` on the row beats the blur that would otherwise close the list
     before the click lands. */
  listbox.addEventListener('pointerdown', (event) => event.preventDefault());

  document.addEventListener('click', (event) => {
    if (!field.contains(event.target as Node)) close();
  });
}

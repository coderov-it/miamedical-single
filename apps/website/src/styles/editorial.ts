/** Shared Tailwind utilities for the editorial home page and site chrome. */
export const EDITORIAL_THEME =
  '[--color-ink:#0b1220] [--color-ink-soft:#5e6878] [--color-surface:#f0f2fa] ' +
  '[--color-surface-2:#f5f6fb] [--color-line:#e7e9ef] [--color-accent:#3846b1] ' +
  '[--color-accent-deep:#262d97] [--color-live:#12924f] [--color-phone-tint:#e1f3e8] ' +
  '[--color-phone-ink:#0b5c39] [--radius-stage:32px] [--radius-bar:24px] ' +
  '[--radius-control:16px] [--shadow-whisper:0_18px_44px_rgb(11_18_32_/_0.06)] ' +
  '[--band-1:clamp(48px,calc(4.29vw+17px),72px)] ' +
  '[--band-2:clamp(56px,calc(5vw+20px),84px)] ' +
  '[--band-3:clamp(64px,calc(5.71vw+23px),96px)] ' +
  '[--band-4:clamp(76px,calc(7.14vw+24.6px),116px)] ' +
  'font-ui text-[1.0625rem] leading-[1.6] text-[#0b1220] ' +
  '[&_h1]:font-ui [&_h1]:tracking-normal [&_h2]:font-ui [&_h2]:tracking-normal ' +
  '[&_h3]:font-ui [&_h3]:tracking-normal [&_button]:cursor-pointer';

export const EDITORIAL_CONTAINER = 'mx-auto w-full max-w-page px-gutter';

/*
 * The home page's section rhythm and headers, matched to the reference site
 * (miamedicalitalia.it, measured 2026-08-31): sections sit on the page's grey
 * ground with white cards, each opening with 92px of air at full width, a
 * plain 30px bold title and an 18.5px soft lede — no rules, no arrow glyphs.
 */
export const HOME_BAND = 'pt-[clamp(56px,calc(5vw+20px),92px)]';
export const HOME_TITLE = 'text-[clamp(1.5rem,2.08vw,1.875rem)] font-bold tracking-[-0.01em]';
export const HOME_LEAD =
  'mt-1.5 text-[clamp(1rem,1.28vw,1.15625rem)] leading-[1.55] text-[var(--color-ink-soft)]';
export const HOME_SEE_ALL =
  'text-[1.0625rem] font-semibold whitespace-nowrap text-[var(--color-accent)] no-underline hover:underline';

export const EDITORIAL_BUTTON =
  'inline-flex min-h-13.5 items-center justify-center rounded-[var(--radius-control)] border-0 ' +
  'bg-[var(--color-accent)] px-8 text-[1.0625rem] font-semibold text-white no-underline ' +
  'hover:bg-[var(--color-accent-deep)]';

export const INVISIBLE_48 =
  'relative after:absolute after:top-1/2 after:left-1/2 after:size-12 ' +
  "after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

export const SECTION_TITLE =
  'inline-flex items-center gap-4 text-[clamp(1.5rem,2.4vw,1.875rem)] font-bold ' +
  'tracking-[-0.02em] [&_svg]:mt-0.75 [&_svg]:flex-none';

export const CATEGORY_GRID =
  'mt-5.5 grid gap-3.5 ' +
  '[grid-template-columns:repeat(auto-fill,minmax(max(168px,calc((100%_-_42px)_/_4)),1fr))]';

export const SECTION_LEAD = 'mt-3.5 text-[1.0625rem] leading-[1.65] text-[var(--color-ink-soft)]';

export const NOTE_BAR =
  'flex items-start gap-3 border-t border-[var(--color-line)] bg-[#f6f7f9] px-7 py-4 ' +
  'text-[0.9688rem] leading-[1.6] text-[var(--color-ink-soft)] [&_svg]:mt-0.5 ' +
  '[&_svg]:flex-none [&_strong]:font-[650] [&_strong]:text-[var(--color-ink)] ' +
  '[&_a]:font-[650] [&_a]:text-[var(--color-accent)] [&_a]:no-underline hover:[&_a]:underline';

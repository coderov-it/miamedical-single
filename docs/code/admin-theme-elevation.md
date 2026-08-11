# Admin theme: the elevation ramp

Everything under `apps/admin/`. Tokens live in `src/styles/app.css`; the shadcn
components consume them through `@theme inline`. This document is the reasoning
behind the numbers, so the token block stays a token block.

Nothing here is shared with `apps/website/` — the storefront has its own token
layer (`docs/code/storefront-design-system.md`) and no Tailwind at all.

---

## Four planes, identical in both themes

| Plane          | Token                                   | What lives there                                                                                              |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **L0** canvas  | `bg-background`                         | the page behind everything — page titles, descriptions, chrome gaps                                           |
| **L1** surface | `bg-card` · `bg-sidebar` · `bg-popover` | cards, sidebar, topbar, sheets, dialogs, dropdowns                                                            |
| **L2** well    | `bg-muted/30…/50`, `bg-input/25`        | recessed _inside_ a surface — card footers, table headers, sortable rows, group boxes, and every form control |
| **L3** content | `bg-card` again                         | a block raised back out of a well (`sortable-list`, `spec-field-list`)                                        |

The ramp is a cycle, not a stack: L3 returns to the L1 value. That is what makes
two-step nesting legible without inventing a fifth colour — a white block inside
a grey well inside a white card reads as three distinct depths.

**Rule of thumb:** if a thing is a container, it is L1 or L3. If it is a
grouping _inside_ a container, or anything a user types into, it is L2.

## Why light mode is the mirror of dark, not a lighter copy

Before this, light mode had `--background`, `--card` and `--sidebar` all within
0.015 of pure white, so L0, L1 and L3 were the same colour and only borders
carried the structure. Dark mode has always had a real ramp
(0.145 → 0.205 → 0.269), which is why it read well and light mode did not.

Light now inverts the direction, matching dark's step sizes inside a surface and
going deliberately softer between the canvas and it. The canvas is muted grey
precisely so that L1 can be pure white — white has to be the raised plane, and it
can only look raised if something sits below it.

Measured in oklch L (perceptually uniform, so the deltas are comparable):

| Step                 | Dark  | Light |
| -------------------- | ----- | ----- |
| canvas → surface     | 0.060 | 0.028 |
| surface → well `/30` | 0.020 | 0.018 |
| surface → well `/40` | 0.026 | 0.025 |
| surface → well `/50` | 0.033 | 0.031 |

The well steps track dark's almost exactly. The canvas step is deliberately
about half of dark's: a grey canvas that matched dark's contrast read as dingy
rather than muted, so light leans on the card's `shadow-xs` and ring to finish
the lift that lightness alone does in dark.

Dark's lightnesses are the stock shadcn ramp and have not moved; the only things
that changed there are its text colours and its hue, below.

Do not close that gap by darkening `--background` without looking at the page —
it is a judgement that was made by eye, at the value where the canvas stops
reading as grey paper and starts reading as dirty white.

## Text in dark is not pure white

`--foreground` in dark is `oklch(0.92 …)`, not the stock `0.985`. Measured against
`--card`:

| Text on `--card` (dark) | Ratio |
| ----------------------- | ----- |
| `0.985` — stock shadcn  | 17.2  |
| `0.92` — now            | 14.1  |
| AAA for body text       | 7.0   |

17:1 is not legibility, it is glare: on a near-black surface pure white haloes and
makes every long back-office session harder than it needs to be. 14:1 is still
double what AAA asks. `--muted-foreground` moved with it, `0.708 → 0.72`, so the
gap between primary and secondary text stayed where it was (7.2:1 on `--card`).

Dark's neutrals also carry the hue-286 trace that light has always had — every
lightness in the ramp is unchanged, so no well needed re-deriving, and the greys
stop reading faintly yellow beside `--primary`.

## The dark accent is ink first, not a button fill first

The stock dark `--primary` was `oklch(0.424 0.199 265)` = `#193cb8`, chosen so
white sits on it at 8:1. Measured the other way round it is **2.0:1 against
`--card`** — which is what `text-primary` and `border-primary` actually need,
because the accent is a badge, a link, a selected border and a radio dot far more
often than it is a button.

Dark now takes the brighter accent and dark ink on it, verified in the browser:

| Use | Ratio |
| --- | --- |
| `--primary` `#3d89ff` as text/border on `--card` | 5.3 |
| the same on `--background` | 5.9 |
| the same inside its own `bg-primary/10` badge fill | 4.7 |
| `--primary-foreground` `#051531` on `--primary` | 5.4 |
| white on `--primary`, had it stayed white | 3.5 |

That last row is why the foreground flipped: at this brightness white _fails_ on
the accent, and keeping white would have meant keeping a blue too dark to read
anywhere else. `--sidebar-primary` takes the same pair, so the app has one accent
rather than a panel blue and a sidebar blue.

Light is untouched: there the accent sits at `0.488` on a white card, where it is
already ink-legible and white-on-accent works.

**Status colours need a `dark:` variant.** `text-emerald-600` on `--card` is
4.8:1 and reads as murky bottle green; `text-amber-600` is 5.7:1. The pattern is
`border-emerald-500/40 text-emerald-600 dark:text-emerald-400` — the `400` shades
land at 9.3:1 and 10.7:1. Anything using a raw Tailwind palette step for text is
light-mode-only until it has the dark half.

## Where the numbers came from

Wells are alpha over their parent, so the composite is computed in sRGB, not by
interpolating the token's L. `--muted` was solved backwards from the target
composites above rather than picked by eye. Re-derive before changing `--muted`,
`--background` or any `/NN` alpha — a plausible-looking token value can easily
land a well on the wrong side of its canvas.

The neutrals carry a trace of chroma at hue 286 (0.003–0.008). Pure `0 0` greys
next to the blue `--primary` read slightly yellow by contrast; the tint is below
the threshold of looking coloured on its own.

## Controls are wells, in both themes

Inputs, textareas, selects, input-groups, checkboxes and radios carry
`bg-input/25` in light and `dark:bg-input/30` in dark. Light mode used to leave
them `bg-transparent`, which meant a white field on a white card separated only
by a hairline border — the single biggest source of the old flatness.

The dark variants win by specificity (`:is(.dark *)` scores an extra class), so
the light fill can be an unprefixed utility without a `dark:` counterpart.

`--input` is doing two jobs: solid, it is the control's border; at 25%, it is the
control's fill. Keep it darker than `--border` — a control outline should out-rank
a structural divider, because a divider only has to be found, whereas a control
has to look interactive.

## Control scale: 40 / 32 / 24

Three rungs, and every control belongs to exactly one:

| Rung  | Height | Used by                                                                      |
| ----- | ------ | ---------------------------------------------------------------------------- |
| 40 px | `h-10` | Text inputs, selects, and the button standing beside one (`default`, `icon`) |
| 32 px | `h-8`  | Dense in-row chrome: `sm` / `icon-sm` buttons, table-cell inputs             |
| 24 px | `h-6`  | Micro controls inside a row: `xs` / `icon-xs`                                |

Fields render at **16px**, not 14. They started at 32px with a `text-base
md:text-sm` downshift — 14px type in a 32px box with 10px of side padding, which
read as cramped and put the text almost against the border. Back-office work is
typing: the field is the surface an operator spends the day inside, so it gets
the generous rung and full-size type, and the 14px `text-sm` stays for labels,
hints and table text where nobody types.

The `default` button sits on the same 40px rung **because of the pairing case** —
a list filter bar puts a search input, two selects and "Apply" on one line, and
a shorter button there reads as a mistake rather than a hierarchy. That is also
why those three filter bars pass no `size` at all. A button inside a row of
something else (a list row's Remove, a reorder arrow) is dense chrome and takes
the 32px rung.

Narrow numeric fields (`w-20` min/max/step) and table-cell inputs opt out by
passing `h-8` explicitly, which beats the base class. Keep that opt-out
deliberate: it is the exception that lets a 40px default exist without loosening
the dense tables.

## Two tokens that are traps

- **`bg-background` is not "white".** Since the canvas moved off white, any
  component using `bg-background` to mean "the surface I'm sitting on" is wrong
  and wants `bg-card`. This was the fix in `button` (outline variant),
  `switch` (thumb), `tabs-trigger` (active) and `field-separator` (label).
  It is still correct in `sidebar-inset`, which really is the canvas.
- **`--muted` is not only a fill.** It is also every `hover:bg-muted` in the
  app. Darkening it for legible wells also made hovers visible, but it means a
  change made for one reason lands on the other.

## Cards

`card.svelte` carries `shadow-xs ring-1 ring-foreground/10 dark:shadow-none`.
The ring does the work in dark, where shadows do not read against a near-black
canvas; the shadow reinforces the lightness step in light. Overlays that float
free of the layout — popover, dropdown, select, sheet, dialog — keep `shadow-md`
in both themes, because a floating surface has to out-rank a merely raised one.

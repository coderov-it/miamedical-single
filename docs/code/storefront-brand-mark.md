# The brand mark in the header

One `<img>`, in `components/global/SiteHeader.astro`. This file exists because
the mark changed shape on 2026-09-08 and the consequences are not obvious from
the markup.

## What changed

```
before   /img/logo.png   2058 × 361   5.70 : 1   horizontal wordmark
after    /img/logo.svg   1105 × 595   1.86 : 1   stacked: runner ∙ wordmark ∙ tagline
```

The client asked for the legacy lockup. It was already in the repo —
`public/img/logo.svg`, committed 2026-08-07, byte-identical to the file supplied
as `docs/assets/miamedical-lagacy-logo.svg`, and unreferenced until now.

**It is not vector.** The `.svg` is a 1105 × 595 PNG in a wrapper: an RGBA
bitmap plus a greyscale soft mask, composited through `mask32` (a PDF → SVG
export). So it does not scale past 1105px wide, and there is no path data to
recolour. 78 KB — still smaller than the 280 KB PNG it replaced.

## Why it is not simply the old sizes

The header sizes the logo by HEIGHT (`w-auto`), and the band is
`min-h-[clamp(52px,5.94vw,76px)]` — 52px on a phone, 76px past 1280px. Swap the
ratio and keep the heights and the mark collapses:

```
              height   width    wordmark cap
old, wide      32px    182px    ~20px          the whole mark is the wordmark
new at old h   32px     59px     ~6px          runner + wordmark + tagline in 32px
new, chosen    52px     97px    ~13px
```

The wordmark band is roughly 25% of this lockup's height, so total height has to
be about four times the type you want to read. Hence:

```
h-9.5      38px  →  71px wide    <720px,  band 52px   →  7px air
mid:h-10   40px  →  75px wide    ≥720px,  band 52px   →  6px air
wide:h-13  52px  →  97px wide    ≥1100px, band 65-76px →  6-12px air
```

That is the largest the mark goes without growing the sticky band. Rendered at
those sizes, `M.i.a. Medical` reads cleanly; **`moving in autonomy` does not** —
it is 4-5px tall, texture rather than reading matter. That is inherent to a
1.86:1 lockup in a 76px band, not a sizing mistake.

## The two remedies, if the tagline has to read

1. **Grow the band** to ~96px at `wide` and take the logo to `h-20`. The sticky
   header is then half again as tall on every scroll, which is a design change
   the owner has to want.
2. **Ask the client for a horizontal variant** for the header and keep this
   lockup for the footer, the OG image and print. A 5.70:1 mark is what a 52-76px
   band is shaped for; this is the normal reason brands ship two lockups.

## What did NOT change

`logo.png` and `logo-v2.png` are still in `public/img/`, now unreferenced.
`favicon.svg` and the four `favicon*.png` are separate artwork and untouched.
Transactional email deliberately uses no image at all — see the comment on
`BRAND` in `packages/templates/src/brand.ts`.

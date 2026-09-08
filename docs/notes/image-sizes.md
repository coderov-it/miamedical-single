# Image and icon sizes

Every image geometry in the system, in the three places geometry is decided:
what the **profile** stores, what the **bucket** actually holds today, and what
the **page** paints it into. Measured 2026-08-31 against the dev bucket and a
1440px viewport.

Source of truth for storage is `MEDIA_PROFILES` in
`packages/validators/src/media.ts` — one table, three consumers (upload route,
admin uploader, save path). Nothing else may invent a geometry.

## 1. Stored geometry — the profiles

| Profile         | Output                              | Fit                            | Max stored  | Accepted source                   |
| --------------- | ----------------------------------- | ------------------------------ | ----------- | --------------------------------- |
| `product_image` | ≤ 2048 × 2048, **aspect preserved** | `inside`, `withoutEnlargement` | 3 MB WebP   | 25 MB, jpeg/png/webp/avif/gif/svg |
| `icon_256`      | exactly **256 × 256** (1:1)         | `cover`, centre                | 256 KB WebP | same                              |
| `icon_1024`     | square, **≤ 1024 × 1024**           | `cover`, centre                | 700 KB WebP | same                              |
| `video`         | unconverted                         | —                              | 30 MB       | mp4 / webm                        |
| `document`      | unconverted                         | —                              | 15 MB       | pdf                               |

Two behaviours that follow from `square` + `edge` vs `maxEdge` in
`packages/media/src/convert/sharp.ts`:

- **`edge` is exact and upscales.** `icon_256` always lands on 256², even from a
  100px source.
- **`maxEdge` only shrinks.** `icon_1024` crops to the source's short side and
  stops there; `product_image` fits inside 2048² and never enlarges.

Rasters are re-encoded WebP at `MEDIA_WEBP_QUALITY` (default **92**),
`smartSubsample: true`. **SVG is never touched** — stored byte-for-byte, bounded
only by the profile's `maxBytes`, so an SVG must already fit the _final_ budget.

## 2. Which slot uses which profile

| Slot                     | Column                                               | Profile           |
| ------------------------ | ---------------------------------------------------- | ----------------- |
| Product thumbnail        | `products.media.thumbnail`                           | `product_image`   |
| Product cutout           | `products.media.cleanPng` (WebP; name is historical) | `product_image`   |
| Product gallery (≤ 30)   | `products.media.gallery`                             | `product_image`   |
| Product videos (≤ 10)    | `products.media.videos`                              | `video`           |
| Product documents (≤ 20) | `products.media.documents`                           | `document`        |
| Category icon            | `categories.icon`                                    | `icon_256`        |
| Spec icon                | `category_specs.icon`                                | `icon_256`        |
| Add-on icon              | `product_addons.icon`                                | `icon_1024`       |
| Blog cover               | `blog_posts.featured_image`                          | **none — see §5** |

Object keys are R2 keys, never URLs; clients prepend `PUBLIC_MEDIA_BASE_URL`.
Layout: `products/<id>/…`, `categories/<id>/icon-<n>.webp`,
`specs/<categoryId>/…`, `addons/<productId>/…`.

## 3. What the bucket actually holds

The profile permits any aspect for a product photo. The migrated WooCommerce
data uses exactly one:

```txt
59 product photos sampled across /catalogo/, /catalogo-noleggio/, /catalogo-vendita/

  51 x  1000x1000   ratio 1.00
   3 x  1200x1200   ratio 1.00
   2 x  2048x2048   ratio 1.00
   1 x  1034x1034   ratio 1.00
   1 x   800x800    ratio 1.00
   1 x   700x700    ratio 1.00
  ────────────────────────────────
  59 / 59 are 1:1.  Not one is 3:2.
```

**So "product shots are 3:2" is a design intent, not a fact about the data.**
Every stage sized at 3:2 or 4:3 letterboxes with side bars today. Do not size a
new stage on the assumption that a photo fills it.

Category icons, all 17:

```txt
17 / 17   256x256 WebP, and all 17 carry a blue frame baked into the pixels
          2–3px at 256², rgb(~2,0,162) ≈ #0200a2 — NOT our accent #3846b1

  probe down the vertical midline of icon-12260.webp:
    y=0   rgb(  2,   0, 162)   blue
    y=1   rgb( 11,   5, 148)   blue, antialiased
    y=2   rgb( 16,  14, 110)   blue, antialiased
    y=4   rgb(255, 255, 255)   white — the icon's own ground
```

Not ours: no border is drawn in `CategoryTile.astro` (its only border is
`border-hair`, the card hairline), and the ingest path is
`toWebp({ square: true, edge: 256 })` — `resize(fit:'cover')` with no `extend`
and no `background`, which crops and shrinks but never paints pixels. The frames
came in from WordPress. Fixing them means either an `extract()` trim at ingest,
guarded on "the edge ring is uniformly non-white", or 17 replacement uploads.

## 4. Render boxes

`object-contain` everywhere on product and icon art — **a product photo is never
cropped** (owner rule). `object-cover` is reserved for blog covers, which are
editorial photography, and for the admin's square thumbnails, which are
identification chips rather than presentation.

### Storefront

| Surface                                  | Declared box                                     | Inset        | Fit       |
| ---------------------------------------- | ------------------------------------------------ | ------------ | --------- |
| Product card well                        | `h-38` 152px → `mid:h-46` 184px, full card width | `p-3.5` 14px | contain   |
| Category tile art, catalogue (`compact`) | `h-20.5` 82px, full tile width                   | —            | contain   |
| Category tile art, home                  | `h-26` 104px, full tile width                    | —            | contain   |
| Home showcase slide                      | `aspect-3/2`, full card width                    | —            | contain   |
| PDP hero stage                           | `aspect-4/3`, column `flex-[0_1_300px]`          | `p-5` 20px   | contain   |
| PDP gallery thumb                        | `aspect-square w-17` 68px                        | `p-1` 4px    | contain   |
| PDP spec icon                            | `size-9.5` 38px                                  | `p-1` 4px    | contain   |
| PDP add-on icon                          | `size-11` 44px                                   | `p-0.5` 2px  | contain   |
| Checkout line, product                   | `size-16` 64px                                   | `p-1` 4px    | contain   |
| Checkout line, add-on                    | `size-11.5` 46px                                 | `p-0.5` 2px  | contain   |
| Cart card                                | `size-13.5` 54px                                 | `p-1` 4px    | contain   |
| Blog card cover                          | `aspect-16/9`, full card width                   | —            | **cover** |
| Blog post hero                           | `w-full`, `max-w-[900px]`                        | —            | **cover** |

Every product/icon `img` also carries `mix-blend-multiply`, which is what makes
the photo's white studio ground disappear into the tint well instead of framing
a white rectangle inside a grey box.

### Admin

| Surface               | Box            | Fit   |
| --------------------- | -------------- | ----- |
| `IconPicker` preview  | `size-14` 56px | cover |
| `MediaDropzone` tile  | `size-14` 56px | cover |
| Categories list thumb | `size-8` 32px  | cover |
| Products list thumb   | `size-9` 36px  | cover |

### Static brand assets

Corrected 2026-09-08 — this table claimed the header wordmark was an inline
`<svg>` and that there was no `apple-touch-icon`. Neither was true.

| File                                     | Size       | Rendered by                                 |
| ---------------------------------------- | ---------- | ------------------------------------------- |
| `apps/website/public/img/logo.svg`       | 1473 × 793 | `SiteHeader` — the brand mark               |
| `apps/website/public/favicon-32x32.png`  | 32 × 32    | `BaseLayout`                                |
| `apps/website/public/favicon-16x16.png`  | 16 × 16    | `BaseLayout`                                |
| `apps/website/public/favicon.png`        | 512 × 512  | `BaseLayout`                                |
| `apps/website/public/apple-touch-icon.png` | 180 × 180 | `BaseLayout`                               |
| `apps/website/public/favicon.svg`        | 32 × 32    | nothing                                     |
| `apps/website/public/img/logo.png`       | 2058 × 361 | nothing — was the header until 2026-09-08   |
| `apps/website/public/img/logo-v2.png`    | 2172 × 724 | nothing                                     |

`logo.svg` is an `<img>` in the header, not inline markup, and it is a PNG in an
SVG wrapper rather than path data — see `docs/code/storefront-brand-mark.md` for
why it is sized the way it is. The footer carries no wordmark at all: its only
`<svg>`s are the phone and social icons, and the brand appears there as type.

Mail uses no image by design — `packages/templates/src/brand.ts` notes that SVG
is stripped by Gmail, Outlook and Apple Mail, and a PNG is blocked by default in
Outlook desktop, so the wordmark is set in type.

No web manifest, and no default `og:image` — `og:image` is set per page from the
product hero or the blog cover, and is absent elsewhere.

### Measured, at 1440px on `/catalogo/`

The gap between the box and the paint, since every photo is 1:1 and no box is:

```txt
product card   382.7 x 370.4
  well         352.7 x 184     padding 14px
  image box    324.7 x 156     natural 1000x1000
  painted      156   x 156     →  48% of the well is filled, 52% is air

category tile  284.5 x 168.5
  art span     258.5 x 82      natural 256x256
  painted       82   x 82      →  32% filled
```

Both wells are far wider than tall while every asset is square, so the art is
height-bound and the side air is structural, not a bug — but it is the reason a
card reads as more empty than its padding suggests. Narrowing a well toward
square is the lever, not shrinking the padding.

## 5. Known drift

- **`blog_posts.featured_image` is bound to no profile.** The admin editor takes
  a hand-typed R2 key or URL (`blog/[id]/+page.svelte`), so a blog cover is
  never validated, converted, resized or capped. Anything reachable can land in
  `og:image` and in a 16:9 `object-cover` box.
- **`media-types.ts` says "the five icon-bearing tables".** There are three:
  `categories`, `category_specs`, `product_addons`.
- **`media-types.ts` says video is "capped at 50 MB".** The profile says 30 MB
  (`31_457_280`).

## 6. Rules

1. A new image slot picks an existing profile. Adding a profile means editing
   `MEDIA_PROFILES` — the one table all three consumers read.
2. Product photography is `object-contain`, always. Cropping a product is a bug,
   not a layout choice.
3. `object-cover` is for blog covers and admin identification chips. Nothing else.
4. Icons are square by contract. Do not build a non-square icon box and expect
   the stored file to fill it.
5. Size a new stage against §3, not against the 3:2 ideal.

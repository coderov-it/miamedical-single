/**
 * The media blob as a gallery: one large viewer under the title, and a strip of
 * thumbnails that drive it.
 *
 * Every slot carries its facts on `data-*` attributes — role, file name, byte
 * size, alt text in both languages, and whether the file was found — so the
 * caption under the viewer is rebuilt by `client.ts` from the DOM rather than
 * from a second copy of the data.
 *
 * A ref that resolves to nothing still gets a thumbnail, drawn red. Skipping it
 * would hide exactly the thing this page exists to surface, and it keeps the
 * strip's indexes matching the order the storefront would read.
 *
 * Pixel dimensions are filled in by the browser from `naturalWidth`, not parsed
 * out of the file here: the browser has already decoded the image, and a
 * JPEG/PNG/WebP header reader is a lot of bytes for a number that is free.
 */
import type { MediaInput, MediaRef } from '../../lib/types.ts';
import type { AssetResolver, ResolvedAsset } from './assets.ts';
import { fileSize } from './assets.ts';
import { escape } from './html.ts';

interface Slot {
  role: string;
  ref: MediaRef;
}

const asRef = (item: string | MediaRef): MediaRef =>
  typeof item === 'string' ? { file: item } : item;

/** Every ref in the blob, in the order the storefront would read them. */
export function slotsOf(media: MediaInput | undefined): Slot[] {
  if (!media) return [];
  const slots: Slot[] = [];
  if (media.thumbnail) slots.push({ role: 'thumbnail', ref: asRef(media.thumbnail) });
  if (media.cleanPng) slots.push({ role: 'cleanPng', ref: asRef(media.cleanPng) });
  for (const [group, items] of [
    ['gallery', media.gallery],
    ['videos', media.videos],
    ['documents', media.documents],
  ] as const) {
    (items ?? []).forEach((item, index) => {
      slots.push({ role: `${group}[${index.toString()}]`, ref: asRef(item) });
    });
  }
  return slots;
}

function thumb(slot: Slot, asset: ResolvedAsset, index: number): string {
  const alt = slot.ref.alt;
  const data = [
    `data-index="${index.toString()}"`,
    `data-role="${escape(slot.role)}"`,
    `data-file="${escape(slot.ref.file)}"`,
    `data-kind="${asset.kind}"`,
    `data-size="${asset.exists ? fileSize(asset.bytes) : ''}"`,
    `data-src="${asset.href}"`,
    `data-path="${escape(asset.sourcePath)}"`,
    `data-alt-it="${escape(alt?.it ?? '')}"`,
    `data-alt-en="${escape(alt?.en ?? '')}"`,
    asset.exists ? '' : 'data-missing="true"',
  ]
    .filter(Boolean)
    .join(' ');

  const face = !asset.exists
    ? '<span class="thumb-face missing">!</span>'
    : asset.kind === 'image'
      ? `<img src="${asset.href}" alt="" loading="lazy">`
      : `<span class="thumb-face">${escape(asset.kind === 'video' ? 'VIDEO' : 'DOC')}</span>`;

  return `<button type="button" class="thumb" ${data}>${face}<span class="thumb-role">${escape(slot.role)}</span></button>`;
}

/** The gallery for one product, plus the refs that resolved to nothing. */
export function renderGallery(
  media: MediaInput | undefined,
  resolve: AssetResolver,
): { html: string; missing: ResolvedAsset[]; count: number } {
  const slots = slotsOf(media);
  if (slots.length === 0) {
    return {
      html: '<div class="gallery empty"><p class="muted">No media on this product.</p></div>',
      missing: [],
      count: 0,
    };
  }

  const missing: ResolvedAsset[] = [];
  const thumbs = slots.map((slot, index) => {
    const asset = resolve(slot.ref.file);
    if (!asset.exists) missing.push(asset);
    return thumb(slot, asset, index);
  });

  return {
    html: `<div class="gallery" data-gallery>
      <div class="viewer" data-viewer></div>
      <figcaption class="viewer-caption" data-caption></figcaption>
      <div class="strip${slots.length === 1 ? ' single' : ''}">${thumbs.join('')}</div>
    </div>`,
    missing,
    count: slots.length,
  };
}

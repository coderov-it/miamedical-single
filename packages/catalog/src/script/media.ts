/**
 * Which photo belongs to which product — read out of the bucket's own record,
 * for use while a product file is being written.
 *
 * The pairing survived the rejected migration intact: it came from WordPress's
 * attachment relations rather than the fuzzy label join that wrecked the spec
 * values, and the alt text still names the subject. What did NOT survive is
 * the code each product was filed under. There is no `code` column, and the
 * ids rule out recovering it — none of the 98 derive from the slug, the title
 * or the slugified title. So the only way back in is the Italian slug, which
 * every product file pins anyway as an SEO commitment.
 *
 *   pnpm catalog:media               every product, in slug order
 *   pnpm catalog:media carrozzina    only slugs containing "carrozzina"
 *
 * Read-only, and deliberately so: it opens one connection, selects, prints and
 * closes. Nothing here writes, moves or deletes an object.
 */
import type { MediaItem, ProductMedia } from '@mia/db/schema';
import { and, asc, createDatabase, eq, ilike, schema } from '@mia/db';

const filter = process.argv[2];
const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL ?? '';

/**
 * A WordPress resized crop rather than the original photo. The marker is not
 * always last — `…-150x150-1.webp` carries a de-duplication suffix after it — so
 * this looks anywhere in the name.
 */
const isResizedCrop = (path: string) => /-\d+x\d+/.test(path);

interface Listed {
  /** Where it sits in the blob, so the field to write is never in doubt. */
  role: string;
  item: MediaItem;
}

function listMedia(media: ProductMedia): Listed[] {
  const listed: Listed[] = [];
  if (media.thumbnail) listed.push({ role: 'thumbnail', item: media.thumbnail });
  if (media.cleanPng) listed.push({ role: 'cleanPng', item: media.cleanPng });
  for (const [group, items] of [
    ['gallery', media.gallery],
    ['videos', media.videos],
    ['documents', media.documents],
  ] as const) {
    items.forEach((item, index) => listed.push({ role: `${group}[${index}]`, item }));
  }
  return listed;
}

const db = createDatabase({ logger: false });

const rows = await db
  .select({
    id: schema.products.id,
    slug: schema.productTranslations.slug,
    title: schema.productTranslations.title,
    media: schema.products.media,
  })
  .from(schema.products)
  .innerJoin(
    schema.productTranslations,
    and(
      eq(schema.productTranslations.productId, schema.products.id),
      eq(schema.productTranslations.languageCode, 'it'),
    ),
  )
  .where(filter ? ilike(schema.productTranslations.slug, `%${filter}%`) : undefined)
  .orderBy(asc(schema.productTranslations.slug));

await db.$client.end();

if (rows.length === 0) {
  // Never a silent empty result: say what was searched for and what exists.
  console.log(
    filter
      ? `No product's Italian slug contains "${filter}".`
      : 'No products in the database at all.',
  );
  process.exit(1);
}

let objects = 0;
let crops = 0;

for (const row of rows) {
  const listed = listMedia(row.media);
  objects += listed.length;

  console.log(`\n${'─'.repeat(78)}`);
  console.log(row.slug);
  console.log(`  ${row.title}`);
  console.log(`  products/${row.id}/`);

  if (listed.length === 0) {
    console.log('  (no media)');
    continue;
  }

  console.log('');
  for (const { role, item } of listed) {
    const file = item.path.replace(`products/${row.id}/`, '');
    const cropped = isResizedCrop(file);
    if (cropped) crops += 1;

    console.log(`  ${role.padEnd(13)} ${file}${cropped ? '   ! WordPress crop' : ''}`);
    const alt = item.alt?.it;
    if (alt) console.log(`  ${' '.repeat(13)} alt  "${alt}"`);
    console.log(`  ${' '.repeat(13)} ${baseUrl}/${item.path}`);
  }
}

console.log(`\n${'─'.repeat(78)}`);
console.log(
  `${String(rows.length)} product(s), ${String(objects)} object(s), ${String(crops)} WordPress crop(s).`,
);
if (!baseUrl) console.log('PUBLIC_MEDIA_BASE_URL is not set, so the URLs above are relative.');

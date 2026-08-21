import sharp from 'sharp';
const url = process.argv[2]!;
const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
try {
  const meta = await sharp(bytes).metadata();
  console.log('metadata ok:', meta.format, meta.width, meta.height, 'space=', meta.space, 'pages=', meta.pages);
} catch (error) {
  console.log('metadata threw:', (error as Error).message);
}
try {
  const out = await sharp(bytes).rotate().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 95 }).toBuffer();
  console.log('encode ok:', out.byteLength);
} catch (error) {
  console.log('encode threw:', (error as Error).message);
}

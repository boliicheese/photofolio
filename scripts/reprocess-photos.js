import 'dotenv/config';
import sharp from 'sharp';
import { db } from '../src/db/client.js';
import { photos } from '../src/db/schema.js';
import { getObject, uploadBuffer } from '../src/services/s3.js';

const WATERMARKED_VARIANTS = [
  { name: 'medium', size: 1200, quality: 82 },
  { name: 'full',   size: 2400, quality: 85 },
];

function outputDims(srcW, srcH, maxSize) {
  const scale = Math.min(maxSize / srcW, maxSize / srcH, 1);
  return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) };
}

function watermarkSvg(w, h) {
  const fontSize = Math.max(14, Math.round(w * 0.02));
  const y = Math.round(h * 0.93);
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<text x="${Math.round(w / 2)}" y="${y}" text-anchor="middle" ` +
    `font-family="Georgia, serif" font-size="${fontSize}px" ` +
    `fill="white" opacity="0.30" letter-spacing="1">© Bolivar Barrios</text>` +
    `</svg>`
  );
}

async function reprocessPhoto(photo) {
  const original = await getObject(photo.s3KeyOriginal);
  const meta = await sharp(original).metadata();

  await Promise.all(
    WATERMARKED_VARIANTS.map(({ name, size, quality }) => {
      const { w, h } = outputDims(meta.width, meta.height, size);
      return sharp(original)
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .composite([{ input: watermarkSvg(w, h), blend: 'over' }])
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
        .then((buf) => uploadBuffer(`photos/${photo.id}/${name}.jpg`, buf, 'image/jpeg'));
    })
  );
}

const all = await db.select({
  id:            photos.id,
  title:         photos.title,
  s3KeyOriginal: photos.s3KeyOriginal,
}).from(photos);

if (all.length === 0) {
  console.log('No hay fotos en la base de datos.');
  process.exit(0);
}

console.log(`Reprocesando ${all.length} foto(s)...\n`);

let ok = 0;
let fail = 0;

for (const photo of all) {
  const label = photo.title ? `"${photo.title}"` : photo.id;
  process.stdout.write(`  ${label} ... `);
  try {
    await reprocessPhoto(photo);
    console.log('✓');
    ok++;
  } catch (err) {
    console.log(`✗  ${err.message}`);
    fail++;
  }
}

console.log(`\nListo. ${ok} exitosa(s), ${fail} fallida(s).`);
process.exit(fail > 0 ? 1 : 0);

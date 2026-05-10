import sharp from 'sharp';
import { getObject, uploadBuffer } from './s3.js';

const VARIANTS = [
  { name: 'thumb',  size: 400,  quality: 75, watermark: false },
  { name: 'medium', size: 1200, quality: 82, watermark: true  },
  { name: 'full',   size: 2400, quality: 85, watermark: true  },
];

function outputDims(srcW, srcH, maxSize) {
  const scale = Math.min(maxSize / srcW, maxSize / srcH, 1);
  return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) };
}

function watermarkSvg(w, h) {
  const fontSize = Math.max(14, Math.round(w * 0.02));
  const x = Math.round(w / 2);
  const y = Math.round(h * 0.93);
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<text x="${x + 1}" y="${y + 1}" text-anchor="middle" ` +
    `font-family="Liberation Serif, serif" font-size="${fontSize}px" ` +
    `fill="#000000" opacity="0.25" letter-spacing="1">&#169; Bolivar Barrios</text>` +
    `<text x="${x}" y="${y}" text-anchor="middle" ` +
    `font-family="Liberation Serif, serif" font-size="${fontSize}px" ` +
    `fill="#ffffff" opacity="0.30" letter-spacing="1">&#169; Bolivar Barrios</text>` +
    `</svg>`
  );
}

export async function processPhoto(photoId) {
  const originalBuffer = await getObject(`photos/${photoId}/original.jpg`);
  const meta = await sharp(originalBuffer).metadata();

  // EXIF orientations 5–8 are 90°/270° rotations — width and height swap
  const exifSwapped = meta.orientation >= 5 && meta.orientation <= 8;
  const displayW = exifSwapped ? (meta.height ?? 0) : (meta.width ?? 0);
  const displayH = exifSwapped ? (meta.width ?? 0) : (meta.height ?? 0);

  await Promise.all(
    VARIANTS.map(({ name, size, quality, watermark }) => {
      const pipeline = sharp(originalBuffer)
        .rotate()
        .resize(size, size, { fit: 'inside', withoutEnlargement: true });

      if (watermark) {
        const { w, h } = outputDims(displayW, displayH, size);
        pipeline.composite([{ input: watermarkSvg(w, h), blend: 'over' }]);
      }

      return pipeline
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
        .then((buf) => uploadBuffer(`photos/${photoId}/${name}.jpg`, buf, 'image/jpeg'));
    })
  );

  return { width: displayW || null, height: displayH || null };
}

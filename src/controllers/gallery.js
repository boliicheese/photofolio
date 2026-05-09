import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { asc } from 'drizzle-orm';
import { getPublicUrl, presignGet } from '../services/s3.js';

export async function getGallery(req, res, next) {
  try {
    const rows = await db.select()
      .from(photos)
      .orderBy(asc(photos.displayOrder), asc(photos.createdAt));

    const photosWithUrls = await Promise.all(rows.map(async (p) => ({
      ...p,
      thumbUrl:    getPublicUrl(p.s3KeyThumb),
      mediumUrl:   getPublicUrl(p.s3KeyMedium),
      fullUrl:     getPublicUrl(p.s3KeyFull),
      originalUrl: await presignGet(p.s3KeyOriginal),
    })));

    res.render('gallery', {
      title: 'Galería — Bolivar Barrios',
      photos: photosWithUrls,
    });
  } catch (err) {
    next(err);
  }
}

import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { asc, isNotNull } from 'drizzle-orm';
import { presignGet } from '../services/s3.js';

export async function getHome(req, res, next) {
  try {
    const rows = await db.select()
      .from(photos)
      .where(isNotNull(photos.carouselOrder))
      .orderBy(asc(photos.carouselOrder))
      .limit(5);

    const carouselPhotos = await Promise.all(
      rows.map(async (p) => ({
        ...p,
        originalUrl: await presignGet(p.s3KeyOriginal),
      }))
    );

    res.render('home', {
      title: res.locals.t.meta.home,
      carouselPhotos,
      heroNav: true,
    });
  } catch (err) {
    next(err);
  }
}

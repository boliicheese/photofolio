import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { asc, isNotNull } from 'drizzle-orm';
import { getPublicUrl } from '../services/s3.js';

export async function getHome(req, res, next) {
  try {
    const rows = await db.select()
      .from(photos)
      .where(isNotNull(photos.carouselOrder))
      .orderBy(asc(photos.carouselOrder))
      .limit(5);

    const carouselPhotos = rows.map((p) => ({
      ...p,
      fullUrl: getPublicUrl(p.s3KeyFull),
    }));

    res.render('home', {
      title: res.locals.t.meta.home,
      carouselPhotos,
      heroNav: true,
    });
  } catch (err) {
    next(err);
  }
}

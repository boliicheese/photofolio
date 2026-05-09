import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { presignGet } from '../services/s3.js';

export async function getHome(req, res, next) {
  try {
    const [featured] = await db.select()
      .from(photos)
      .where(eq(photos.featured, true))
      .orderBy(asc(photos.displayOrder))
      .limit(1);

    res.render('home', {
      title: 'Bolivar Barrios — Fotografía desde Panamá',
      featured: featured
        ? { ...featured, originalUrl: await presignGet(featured.s3KeyOriginal) }
        : null,
      heroNav: true,
    });
  } catch (err) {
    next(err);
  }
}

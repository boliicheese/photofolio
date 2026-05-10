import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { asc, count, eq } from 'drizzle-orm';
import { getPublicUrl, presignGet } from '../services/s3.js';

const PAGE_SIZE = 24;

export async function getGallery(req, res, next) {
  try {
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(photos)
        .orderBy(asc(photos.displayOrder), asc(photos.createdAt))
        .limit(PAGE_SIZE),
      db.select({ total: count() }).from(photos),
    ]);

    const photosWithUrls = rows.map((p) => ({
      id:             p.id,
      title:          p.title,
      location:       p.location,
      shotAt:         p.shotAt,
      thumbUrl:       getPublicUrl(p.s3KeyThumb),
      fullUrl:        getPublicUrl(p.s3KeyFull),
      originalWidth:  p.originalWidth,
      originalHeight: p.originalHeight,
    }));

    const totalCount = Number(total);

    res.render('gallery', {
      title: res.locals.t.meta.gallery,
      photos: photosWithUrls,
      hasMore: totalCount > PAGE_SIZE,
    });
  } catch (err) {
    next(err);
  }
}

export async function getGalleryMore(req, res, next) {
  try {
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(photos)
        .orderBy(asc(photos.displayOrder), asc(photos.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db.select({ total: count() }).from(photos),
    ]);

    res.json({
      photos: rows.map((p) => ({
        id:             p.id,
        title:          p.title,
        location:       p.location,
        shotAt:         p.shotAt,
        thumbUrl:       getPublicUrl(p.s3KeyThumb),
        fullUrl:        getPublicUrl(p.s3KeyFull),
        originalWidth:  p.originalWidth,
        originalHeight: p.originalHeight,
      })),
      hasMore: offset + PAGE_SIZE < Number(total),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPhotoOriginalUrl(req, res, next) {
  try {
    const { id } = req.params;
    const [photo] = await db.select({ s3KeyOriginal: photos.s3KeyOriginal })
      .from(photos)
      .where(eq(photos.id, id))
      .limit(1);

    if (!photo) return res.status(404).json({ error: 'Not found' });

    const url = await presignGet(photo.s3KeyOriginal);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

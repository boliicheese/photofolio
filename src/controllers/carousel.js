import { db } from '../db/client.js';
import { photos } from '../db/schema.js';
import { eq, asc, isNotNull } from 'drizzle-orm';
import { getPublicUrl } from '../services/s3.js';

export async function getCarouselAdmin(req, res, next) {
  try {
    const [carouselPhotos, allPhotos] = await Promise.all([
      db.select().from(photos).where(isNotNull(photos.carouselOrder)).orderBy(asc(photos.carouselOrder)),
      db.select({ id: photos.id, title: photos.title, s3KeyThumb: photos.s3KeyThumb })
        .from(photos).orderBy(asc(photos.displayOrder), asc(photos.createdAt)),
    ]);

    const slots = Array.from({ length: 5 }, (_, i) => {
      const pos = i + 1;
      const found = carouselPhotos.find((p) => p.carouselOrder === pos) || null;
      return {
        position: pos,
        photo: found ? { ...found, thumbUrl: getPublicUrl(found.s3KeyThumb) } : null,
      };
    });

    res.render('admin/carousel', {
      title: res.locals.t.meta.adminCarousel,
      slots,
      allPhotos: allPhotos.map((p) => ({ ...p, thumbUrl: getPublicUrl(p.s3KeyThumb) })),
    });
  } catch (err) {
    next(err);
  }
}

export async function putCarouselSlot(req, res, next) {
  try {
    const position = Number(req.params.position);
    if (![1, 2, 3, 4, 5].includes(position)) return res.status(400).json({ error: 'Invalid position' });

    const { photoId } = req.body;
    if (!photoId) return res.status(400).json({ error: 'photoId required' });

    await db.update(photos).set({ carouselOrder: null }).where(eq(photos.carouselOrder, position));
    await db.update(photos).set({ carouselOrder: null }).where(eq(photos.id, photoId));
    await db.update(photos).set({ carouselOrder: position }).where(eq(photos.id, photoId));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteCarouselSlot(req, res, next) {
  try {
    const position = Number(req.params.position);
    if (![1, 2, 3, 4, 5].includes(position)) return res.status(400).json({ error: 'Invalid position' });

    await db.update(photos).set({ carouselOrder: null }).where(eq(photos.carouselOrder, position));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

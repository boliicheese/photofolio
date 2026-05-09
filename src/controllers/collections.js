import { z } from 'zod';
import { db } from '../db/client.js';
import { photos, collections, photoCollections } from '../db/schema.js';
import { eq, asc, count } from 'drizzle-orm';
import { getPublicUrl, presignGet } from '../services/s3.js';

// ── Public ────────────────────────────────────────────────────────────────────

export async function getCollections(req, res, next) {
  try {
    const cols = await db.select().from(collections).orderBy(asc(collections.displayOrder));

    const enriched = await Promise.all(
      cols.map(async (col) => {
        const [{ total }] = await db
          .select({ total: count() })
          .from(photoCollections)
          .where(eq(photoCollections.collectionId, col.id));

        let coverUrl = null;
        if (col.coverPhotoId) {
          const [cover] = await db.select({ key: photos.s3KeyThumb })
            .from(photos).where(eq(photos.id, col.coverPhotoId)).limit(1);
          if (cover) coverUrl = getPublicUrl(cover.key);
        }

        return { ...col, photoCount: Number(total), coverUrl };
      })
    );

    res.render('collections', { title: 'Colecciones — Bolivar Barrios', collections: enriched });
  } catch (err) {
    next(err);
  }
}

export async function getCollection(req, res, next) {
  try {
    const { slug } = req.params;
    const [col] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
    if (!col) return next();

    const rows = await db
      .select({ photo: photos })
      .from(photoCollections)
      .innerJoin(photos, eq(photoCollections.photoId, photos.id))
      .where(eq(photoCollections.collectionId, col.id))
      .orderBy(asc(photos.displayOrder), asc(photos.createdAt));

    const photosWithUrls = await Promise.all(rows.map(async ({ photo: p }) => ({
      ...p,
      thumbUrl:    getPublicUrl(p.s3KeyThumb),
      mediumUrl:   getPublicUrl(p.s3KeyMedium),
      fullUrl:     getPublicUrl(p.s3KeyFull),
      originalUrl: await presignGet(p.s3KeyOriginal),
    })));

    res.render('collection', {
      title: `${col.name} — Bolivar Barrios`,
      collection: col,
      photos: photosWithUrls,
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAdminCollections(req, res, next) {
  try {
    const [cols, allPhotos] = await Promise.all([
      db.select().from(collections).orderBy(asc(collections.displayOrder)),
      db.select({ id: photos.id, title: photos.title, s3KeyThumb: photos.s3KeyThumb })
        .from(photos).orderBy(asc(photos.displayOrder)),
    ]);

    res.render('admin/collections', {
      title: 'Colecciones — Admin',
      collections: cols,
      photos: allPhotos.map((p) => ({ ...p, thumbUrl: getPublicUrl(p.s3KeyThumb) })),
    });
  } catch (err) {
    next(err);
  }
}

const colSchema = z.object({
  name:         z.string().min(1).max(255).trim(),
  slug:         z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description:  z.string().max(1000).trim().optional(),
  coverPhotoId: z.string().uuid().optional().or(z.literal('')),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export async function postCollection(req, res, next) {
  try {
    const result = colSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const data = { ...result.data, coverPhotoId: result.data.coverPhotoId || null };
    const [col] = await db.insert(collections).values(data).returning();
    res.json({ collection: col });
  } catch (err) {
    next(err);
  }
}

export async function patchCollection(req, res, next) {
  try {
    const { id } = req.params;
    const result = colSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });

    const data = { ...result.data, ...(result.data.coverPhotoId !== undefined && { coverPhotoId: result.data.coverPhotoId || null }) };
    const [col] = await db.update(collections).set(data).where(eq(collections.id, id)).returning();
    res.json({ collection: col });
  } catch (err) {
    next(err);
  }
}

export async function deleteCollection(req, res, next) {
  try {
    const { id } = req.params;
    await db.delete(collections).where(eq(collections.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

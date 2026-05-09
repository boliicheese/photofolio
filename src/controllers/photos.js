import { z } from 'zod';
import { db } from '../db/client.js';
import { photos, tags, photoTags, photoCollections, collections } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { deleteObjects, getPublicUrl, presignGet } from '../services/s3.js';

export async function getPhotoList(req, res, next) {
  try {
    const [allPhotos, allCollections] = await Promise.all([
      db.select().from(photos).orderBy(asc(photos.displayOrder), asc(photos.createdAt)),
      db.select().from(collections).orderBy(asc(collections.displayOrder)),
    ]);

    const photosWithUrls = await Promise.all(
      allPhotos.map(async (p) => ({
        ...p,
        thumbUrl:   getPublicUrl(p.s3KeyThumb),
        mediumUrl:  await presignGet(p.s3KeyMedium),
      }))
    );

    res.render('admin/photos', {
      title: 'Fotos — Admin',
      photos: photosWithUrls,
      collections: allCollections,
    });
  } catch (err) {
    next(err);
  }
}

const updateSchema = z.object({
  title:        z.string().max(255).trim().optional(),
  caption:      z.string().max(5000).trim().optional(),
  location:     z.string().max(255).trim().optional(),
  shotAt:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  featured:     z.coerce.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  collectionId: z.string().uuid().optional().or(z.literal('')),
  tags:         z.string().optional(), // comma-separated
});

export async function patchPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const result = updateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }

    const { title, caption, location, shotAt, featured, displayOrder, collectionId, tags: tagsStr } = result.data;

    const updateData = {
      updatedAt: new Date(),
      ...(title        !== undefined && { title:        title || null }),
      ...(caption      !== undefined && { caption:      caption || null }),
      ...(location     !== undefined && { location:     location || null }),
      ...(shotAt       !== undefined && { shotAt:       shotAt || null }),
      ...(featured     !== undefined && { featured }),
      ...(displayOrder !== undefined && { displayOrder }),
    };

    await db.update(photos).set(updateData).where(eq(photos.id, id));

    if (collectionId !== undefined) {
      await db.delete(photoCollections).where(eq(photoCollections.photoId, id));
      if (collectionId) {
        await db.insert(photoCollections).values({ photoId: id, collectionId }).onConflictDoNothing();
      }
    }

    if (tagsStr !== undefined) {
      await db.delete(photoTags).where(eq(photoTags.photoId, id));
      const names = tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const name of names) {
        const [tag] = await db.insert(tags)
          .values({ name })
          .onConflictDoUpdate({ target: tags.name, set: { name } })
          .returning();
        await db.insert(photoTags).values({ photoId: id, tagId: tag.id }).onConflictDoNothing();
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
    if (!photo) return res.status(404).json({ error: 'Not found' });

    await deleteObjects([photo.s3KeyOriginal, photo.s3KeyThumb, photo.s3KeyMedium, photo.s3KeyFull]);
    await db.delete(photos).where(eq(photos.id, id));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

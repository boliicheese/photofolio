import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '../db/client.js';
import { photos, tags, photoTags, photoCollections, collections } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { presignPut } from '../services/s3.js';
import { processPhoto } from '../services/image.js';

const MAX_SIZE = 25 * 1024 * 1024;

const presignSchema = z.object({
  filename:    z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png']),
  size:        z.number().int().positive().max(MAX_SIZE),
});

const completeSchema = z.object({
  photoId:      z.string().uuid(),
  title:        z.string().max(255).trim().optional(),
  caption:      z.string().max(5000).trim().optional(),
  location:     z.string().max(255).trim().optional(),
  shotAt:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  collectionId: z.string().uuid().optional().or(z.literal('')),
  tags:         z.array(z.string().max(100).trim()).max(20).optional(),
});

export async function getUploadPage(req, res, next) {
  try {
    const allCollections = await db.select({ id: collections.id, name: collections.name })
      .from(collections)
      .orderBy(asc(collections.displayOrder));
    res.render('admin/upload', { title: res.locals.t.meta.adminUpload, collections: allCollections });
  } catch (err) {
    next(err);
  }
}

export async function postPresign(req, res, next) {
  try {
    const result = presignSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const { contentType } = result.data;
    const photoId = randomUUID();
    const key = `photos/${photoId}/original.jpg`;
    const presignedUrl = await presignPut(key, contentType, 300);
    res.json({ presignedUrl, photoId });
  } catch (err) {
    next(err);
  }
}

export async function postComplete(req, res, next) {
  try {
    const result = completeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }

    const { photoId, title, caption, location, shotAt, collectionId, tags: tagNames } = result.data;

    const { width, height } = await processPhoto(photoId);

    const [photo] = await db.insert(photos).values({
      id:             photoId,
      title:          title || null,
      caption:        caption || null,
      location:       location || null,
      shotAt:         shotAt || null,
      s3KeyThumb:     `photos/${photoId}/thumb.jpg`,
      s3KeyMedium:    `photos/${photoId}/medium.jpg`,
      s3KeyFull:      `photos/${photoId}/full.jpg`,
      s3KeyOriginal:  `photos/${photoId}/original.jpg`,
      originalWidth:  width,
      originalHeight: height,
    }).returning();

    if (tagNames?.length) {
      for (const rawName of tagNames) {
        const name = rawName.trim().toLowerCase();
        if (!name) continue;
        const [tag] = await db.insert(tags)
          .values({ name })
          .onConflictDoUpdate({ target: tags.name, set: { name } })
          .returning();
        await db.insert(photoTags)
          .values({ photoId: photo.id, tagId: tag.id })
          .onConflictDoNothing();
      }
    }

    if (collectionId) {
      await db.insert(photoCollections)
        .values({ photoId: photo.id, collectionId })
        .onConflictDoNothing();
    }

    res.json({ photo });
  } catch (err) {
    next(err);
  }
}

import { db } from '../db/client.js';
import { photos, collections, contactSubmissions } from '../db/schema.js';
import { count, isNull } from 'drizzle-orm';

export async function getDashboard(req, res, next) {
  try {
    const [[photoRow], [colRow], [unreadRow]] = await Promise.all([
      db.select({ count: count() }).from(photos),
      db.select({ count: count() }).from(collections),
      db.select({ count: count() }).from(contactSubmissions).where(isNull(contactSubmissions.readAt)),
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard — Admin',
      photoCount:       Number(photoRow.count),
      collectionCount:  Number(colRow.count),
      unreadCount:      Number(unreadRow.count),
    });
  } catch (err) {
    next(err);
  }
}

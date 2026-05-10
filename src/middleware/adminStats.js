import { db } from '../db/client.js';
import { contactSubmissions } from '../db/schema.js';
import { isNull, count } from 'drizzle-orm';

export async function adminStats(req, res, next) {
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(contactSubmissions)
      .where(isNull(contactSubmissions.readAt));
    res.locals.unreadCount = Number(total);
  } catch {
    res.locals.unreadCount = 0;
  }
  next();
}

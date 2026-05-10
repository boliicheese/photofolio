import { db } from '../db/client.js';
import { contactSubmissions } from '../db/schema.js';
import { eq, count } from 'drizzle-orm';

export async function adminStats(req, res, next) {
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.isRead, false));
    res.locals.unreadCount = Number(total);
  } catch {
    res.locals.unreadCount = 0;
  }
  next();
}

import { db } from '../db/client.js';
import { contactSubmissions } from '../db/schema.js';
import { eq, desc, isNull } from 'drizzle-orm';

export async function getSubmissions(req, res, next) {
  try {
    const rows = await db.select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));

    res.render('admin/submissions', { title: res.locals.t.meta.adminSubmissions, submissions: rows });
  } catch (err) {
    next(err);
  }
}

export async function patchSubmissionRead(req, res, next) {
  try {
    const { id } = req.params;
    await db.update(contactSubmissions)
      .set({ readAt: new Date() })
      .where(eq(contactSubmissions.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../db/client.js';
import { adminUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export function getLogin(req, res) {
  if (req.session?.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Login — Admin', error: null });
}

export async function postLogin(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).render('admin/login', {
        title: 'Login — Admin',
        error: 'Email y contraseña requeridos.',
      });
    }

    const { email, password } = result.data;
    const [user] = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    // Constant-time: always run bcrypt even on miss, to prevent timing attacks
    const hash = user?.passwordHash ?? '$2b$12$invalidhashpadding000000000000000000000000000000000000';
    const valid = await bcrypt.compare(password, hash);

    if (!user || !valid) {
      return res.status(401).render('admin/login', {
        title: 'Login — Admin',
        error: 'Email o contraseña incorrectos.',
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = user.id;
      res.redirect('/admin');
    });
  } catch (err) {
    next(err);
  }
}

export function postLogout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
}

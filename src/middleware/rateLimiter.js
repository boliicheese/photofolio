import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/admin') && req.session?.adminId,
});

export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const t = res.locals?.t;
    res.status(429).render('contact', {
      title: t?.meta?.contact || 'Contacto — Bolivar Barrios',
      error: t?.contact?.rateLimit || 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
      formData: {},
      success: false,
    });
  },
});

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
    res.status(429).render('contact', {
      title: 'Contacto — Bolivar Barrios',
      error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
      formData: {},
      success: false,
    });
  },
});

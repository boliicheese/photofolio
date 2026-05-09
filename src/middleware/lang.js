import { i18n } from '../i18n/index.js';

export function langMiddleware(req, res, next) {
  const lang = ['es', 'en'].includes(req.session?.lang) ? req.session.lang : 'es';
  res.locals.t = i18n[lang];
  res.locals.lang = lang;
  res.locals.currentPath = req.path;
  next();
}

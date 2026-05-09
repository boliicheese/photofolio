import { Router } from 'express';
import { getHome } from '../controllers/home.js';
import { getGallery, getGalleryMore, getPhotoOriginalUrl } from '../controllers/gallery.js';
import { getCollections, getCollection } from '../controllers/collections.js';
import { getAbout } from '../controllers/about.js';
import { getContact, postContact } from '../controllers/contact.js';
import { contactLimiter } from '../middleware/rateLimiter.js';

export const publicRouter = Router();

publicRouter.get('/lang/:code', (req, res) => {
  const { code } = req.params;
  if (['es', 'en'].includes(code)) req.session.lang = code;
  const back = req.get('Referrer') || '/';
  res.redirect(back);
});

publicRouter.get('/', getHome);
publicRouter.get('/gallery', getGallery);
publicRouter.get('/gallery/more', getGalleryMore);
publicRouter.get('/api/photos/:id/original', getPhotoOriginalUrl);
publicRouter.get('/collections', getCollections);
publicRouter.get('/collections/:slug', getCollection);
publicRouter.get('/about', getAbout);
publicRouter.get('/contact', getContact);
publicRouter.post('/contact', contactLimiter, postContact);

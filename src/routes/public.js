import { Router } from 'express';
import { getHome } from '../controllers/home.js';
import { getGallery } from '../controllers/gallery.js';
import { getCollections, getCollection } from '../controllers/collections.js';
import { getAbout } from '../controllers/about.js';
import { getContact, postContact } from '../controllers/contact.js';
import { contactLimiter } from '../middleware/rateLimiter.js';

export const publicRouter = Router();

publicRouter.get('/', getHome);
publicRouter.get('/gallery', getGallery);
publicRouter.get('/collections', getCollections);
publicRouter.get('/collections/:slug', getCollection);
publicRouter.get('/about', getAbout);
publicRouter.get('/contact', getContact);
publicRouter.post('/contact', contactLimiter, postContact);

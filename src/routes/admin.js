import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getLogin, postLogin, postLogout } from '../controllers/auth.js';
import { getDashboard } from '../controllers/dashboard.js';
import { getPhotoList, patchPhoto, deletePhoto, getPhotoOriginalDownload } from '../controllers/photos.js';
import { getUploadPage, postPresign, postComplete } from '../controllers/upload.js';
import { getAdminCollections, postCollection, patchCollection, deleteCollection } from '../controllers/collections.js';
import { getSubmissions, patchSubmissionRead } from '../controllers/submissions.js';
import { getCarouselAdmin, putCarouselSlot, deleteCarouselSlot } from '../controllers/carousel.js';

export const adminRouter = Router();

adminRouter.get('/login', getLogin);
adminRouter.post('/login', postLogin);
adminRouter.post('/logout', requireAuth, postLogout);

adminRouter.get('/', requireAuth, getDashboard);

adminRouter.get('/photos', requireAuth, getPhotoList);
adminRouter.get('/photos/upload', requireAuth, getUploadPage);
adminRouter.get('/photos/:id/download', requireAuth, getPhotoOriginalDownload);
adminRouter.patch('/photos/:id', requireAuth, patchPhoto);
adminRouter.delete('/photos/:id', requireAuth, deletePhoto);

// Upload JSON endpoints (kept under /admin for simplicity — auth via same middleware)
adminRouter.post('/upload/presign', requireAuth, postPresign);
adminRouter.post('/upload/complete', requireAuth, postComplete);

adminRouter.get('/collections', requireAuth, getAdminCollections);
adminRouter.post('/collections', requireAuth, postCollection);
adminRouter.patch('/collections/:id', requireAuth, patchCollection);
adminRouter.delete('/collections/:id', requireAuth, deleteCollection);

adminRouter.get('/submissions', requireAuth, getSubmissions);
adminRouter.patch('/submissions/:id/read', requireAuth, patchSubmissionRead);

adminRouter.get('/carousel', requireAuth, getCarouselAdmin);
adminRouter.put('/carousel/:position', requireAuth, putCarouselSlot);
adminRouter.delete('/carousel/:position', requireAuth, deleteCarouselSlot);

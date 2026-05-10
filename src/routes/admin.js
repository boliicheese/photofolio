import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { adminStats } from '../middleware/adminStats.js';
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

adminRouter.use(requireAuth, adminStats);

adminRouter.get('/', getDashboard);

adminRouter.get('/photos', getPhotoList);
adminRouter.get('/photos/upload', getUploadPage);
adminRouter.get('/photos/:id/download', getPhotoOriginalDownload);
adminRouter.patch('/photos/:id', patchPhoto);
adminRouter.delete('/photos/:id', deletePhoto);

adminRouter.post('/upload/presign', postPresign);
adminRouter.post('/upload/complete', postComplete);

adminRouter.get('/collections', getAdminCollections);
adminRouter.post('/collections', postCollection);
adminRouter.patch('/collections/:id', patchCollection);
adminRouter.delete('/collections/:id', deleteCollection);

adminRouter.get('/submissions', getSubmissions);
adminRouter.patch('/submissions/:id/read', patchSubmissionRead);

adminRouter.get('/carousel', getCarouselAdmin);
adminRouter.put('/carousel/:position', putCarouselSlot);
adminRouter.delete('/carousel/:position', deleteCarouselSlot);

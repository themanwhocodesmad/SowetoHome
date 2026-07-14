import { Router } from 'express';
import {
  moderatePropertySchema,
  reviewHostApplicationSchema,
  suspendUserSchema,
  updatePlatformSettingsSchema,
} from '@soweto-stays/shared';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as adminController from './admin.controller.js';
import { siteImageUpload } from './siteImage.upload.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/users', adminController.listUsers);
adminRouter.post('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);

adminRouter.get('/host-applications', adminController.listHostApplications);
adminRouter.post(
  '/host-applications/:id/review',
  validate(reviewHostApplicationSchema),
  adminController.reviewHostApplication,
);

adminRouter.get('/properties', adminController.listProperties);
adminRouter.post(
  '/properties/:id/moderate',
  validate(moderatePropertySchema),
  adminController.moderateProperty,
);

adminRouter.get('/bookings', adminController.listBookings);

adminRouter.get('/settings', adminController.getSettings);
adminRouter.patch(
  '/settings',
  validate(updatePlatformSettingsSchema),
  adminController.updateSettings,
);

adminRouter.get('/analytics', adminController.getAnalytics);

adminRouter.get('/site-images', adminController.getSiteImages);
adminRouter.post('/site-images/:key', siteImageUpload, adminController.uploadSiteImage);
adminRouter.delete('/site-images/:key', adminController.deleteSiteImage);

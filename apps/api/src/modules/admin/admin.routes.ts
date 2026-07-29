import { Router } from 'express';
import {
  moderatePropertySchema,
  suspendUserSchema,
  updateAboutContentSchema,
  updateContactContentSchema,
  updateHomepageSchema,
  updatePlatformSettingsSchema,
  updateSectionSpacingSchema,
  updateServicesContentSchema,
  updateTypographySchema,
} from '@soweto-stays/shared';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as adminController from './admin.controller.js';
import { siteImageUpload } from './siteImage.upload.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/users', adminController.listUsers);
adminRouter.post('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);
adminRouter.post('/users/:id/grant-host', adminController.grantHost);

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
adminRouter.patch(
  '/settings/section-spacing',
  validate(updateSectionSpacingSchema),
  adminController.updateSectionSpacing,
);
adminRouter.patch(
  '/settings/typography',
  validate(updateTypographySchema),
  adminController.updateTypography,
);

adminRouter.get('/pages/about', adminController.getAboutContent);
adminRouter.patch(
  '/pages/about',
  validate(updateAboutContentSchema),
  adminController.updateAboutContent,
);
adminRouter.get('/pages/services', adminController.getServicesContent);
adminRouter.patch(
  '/pages/services',
  validate(updateServicesContentSchema),
  adminController.updateServicesContent,
);
adminRouter.get('/pages/contact', adminController.getContactContent);
adminRouter.patch(
  '/pages/contact',
  validate(updateContactContentSchema),
  adminController.updateContactContent,
);

adminRouter.get('/analytics', adminController.getAnalytics);

adminRouter.get('/site-images', adminController.getSiteImages);
adminRouter.post('/site-images/:key', siteImageUpload, adminController.uploadSiteImage);
adminRouter.delete('/site-images/:key', adminController.deleteSiteImage);

adminRouter.get('/homepage', adminController.getHomepage);
adminRouter.patch('/homepage', validate(updateHomepageSchema), adminController.updateHomepage);

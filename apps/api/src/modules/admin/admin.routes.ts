import { Router } from 'express';
import {
  moderatePropertySchema,
  suspendUserSchema,
  updatePlatformSettingsSchema,
  updateSectionSpacingSchema,
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

// No Zod validation on these three (or on /homepage below) - admins editing page copy
// shouldn't be blocked by field-length rules, same reasoning as the property on-behalf
// route in property.routes.ts.
adminRouter.get('/pages/about', adminController.getAboutContent);
adminRouter.patch('/pages/about', adminController.updateAboutContent);
adminRouter.get('/pages/services', adminController.getServicesContent);
adminRouter.patch('/pages/services', adminController.updateServicesContent);
adminRouter.get('/pages/contact', adminController.getContactContent);
adminRouter.patch('/pages/contact', adminController.updateContactContent);

adminRouter.get('/analytics', adminController.getAnalytics);

adminRouter.get('/site-images', adminController.getSiteImages);
adminRouter.post('/site-images/:key', siteImageUpload, adminController.uploadSiteImage);
adminRouter.delete('/site-images/:key', adminController.deleteSiteImage);

adminRouter.get('/homepage', adminController.getHomepage);
adminRouter.patch('/homepage', adminController.updateHomepage);

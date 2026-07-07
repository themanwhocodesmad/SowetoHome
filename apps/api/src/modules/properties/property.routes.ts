import { Router } from 'express';
import {
  createPropertySchema,
  propertySearchQuerySchema,
  updatePropertySchema,
} from '@soweto-stays/shared';
import { authenticate, optionalAuthenticate, requireRole } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as propertyController from './property.controller.js';
import { propertyImageUpload } from './upload.js';

export const propertyRouter = Router();

// NOTE: static segments (/mine, /on-behalf/:hostId) must be registered before the
// catch-all /:id route, or Express would try to match them as a property id.
propertyRouter.get('/mine', authenticate, requireRole('host'), propertyController.listMine);

propertyRouter.post(
  '/on-behalf/:hostId',
  authenticate,
  requireRole('admin'),
  validate(createPropertySchema),
  propertyController.createOnBehalf,
);

propertyRouter.get('/', validate(propertySearchQuerySchema, 'query'), propertyController.search);

propertyRouter.post(
  '/',
  authenticate,
  requireRole('host'),
  validate(createPropertySchema),
  propertyController.createMine,
);

propertyRouter.get('/:id', optionalAuthenticate, propertyController.getById);

propertyRouter.patch('/:id', authenticate, validate(updatePropertySchema), propertyController.update);

propertyRouter.post(
  '/:id/images',
  authenticate,
  propertyImageUpload,
  propertyController.uploadImages,
);

propertyRouter.delete('/:id/images', authenticate, propertyController.removeImage);

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

propertyRouter.get('/', validate(propertySearchQuerySchema, 'query'), propertyController.search);

// The platform (admin) is the sole host of every listing - there is no self-serve host
// signup/creation flow anymore, so this is the only property-creation route.
propertyRouter.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createPropertySchema),
  propertyController.create,
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

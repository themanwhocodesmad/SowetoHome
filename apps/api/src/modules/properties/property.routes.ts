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

// No Zod validation here (unlike the host self-serve route below) - an admin
// filling this in on a host's behalf shouldn't be blocked by field-length/format
// rules; the Mongoose schema's required/min constraints are still the backstop.
propertyRouter.post(
  '/on-behalf/:hostId',
  authenticate,
  requireRole('admin'),
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

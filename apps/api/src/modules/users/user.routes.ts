import { Router } from 'express';
import { updateProfileSchema, applyHostSchema } from '@soweto-stays/shared';
import { authenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as userController from './user.controller.js';

export const userRouter = Router();

userRouter.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile,
);

userRouter.post(
  '/host-application',
  authenticate,
  validate(applyHostSchema),
  userController.applyToHost,
);

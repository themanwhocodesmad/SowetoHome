import { Router } from 'express';
import { updateProfileSchema, addHostRoleSchema } from '@soweto-stays/shared';
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
  '/become-host',
  authenticate,
  validate(addHostRoleSchema),
  userController.becomeHost,
);

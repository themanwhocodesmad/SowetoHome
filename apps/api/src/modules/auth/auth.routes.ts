import { Router } from 'express';
import { googleSignInSchema } from '@soweto-stays/shared';
import { authenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

// GIS credential flow: the frontend's Google button POSTs the ID token here. There is no
// server-side redirect/callback route - Google never navigates the browser to the API.
authRouter.post('/google', validate(googleSignInSchema), authController.googleSignIn);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);

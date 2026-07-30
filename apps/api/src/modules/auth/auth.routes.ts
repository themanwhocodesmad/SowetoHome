import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPasswordSchema,
  googleSignInSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@soweto-stays/shared';
import { authenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

// GIS credential flow: the frontend's Google button POSTs the ID token here. There is no
// server-side redirect/callback route - Google never navigates the browser to the API.
authRouter.post('/google', validate(googleSignInSchema), authController.googleSignIn);

// Narrow rate limit on password login/reset-request only - these are the brute-forceable/
// enumerable endpoints here (Google sign-in is bottlenecked by Google's own token issuance).
const loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const forgotPasswordRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', loginRateLimit, validate(loginSchema), authController.login);
authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);

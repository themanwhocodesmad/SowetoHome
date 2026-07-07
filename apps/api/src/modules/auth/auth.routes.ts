import { Router } from 'express';
import passport from 'passport';
import { env } from '../../common/config/env.js';
import { authenticate } from '../../common/middleware/auth.js';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
  }),
  authController.googleCallback,
);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);

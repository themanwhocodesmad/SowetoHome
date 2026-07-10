import type { Request, Response } from 'express';
import type { GoogleSignInInput } from '@soweto-stays/shared';
import { isProduction } from '../../common/config/env.js';
import { asyncHandler } from '../../common/middleware/asyncHandler.js';
import { AppError } from '../../common/errors/AppError.js';
import { ok } from '../../common/http/respond.js';
import { UserModel, type UserDocument } from '@soweto-stays/db';
import { toUserDto, userService } from '../users/user.service.js';
import { verifyGoogleCredential } from './googleIdToken.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';

export const REFRESH_COOKIE_NAME = 'sowetostays_refresh';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function issueTokens(res: Response, user: UserDocument): string {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    roles: user.roles,
  });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
  });

  return accessToken;
}

export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body as GoogleSignInInput;
  const profile = await verifyGoogleCredential(credential);
  const user = await userService.findOrCreateFromGoogleProfile(profile);
  if (user.isSuspended) throw AppError.forbidden('This account has been suspended');

  const accessToken = issueTokens(res, user);
  ok(res, { accessToken, user: toUserDto(user) });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[
    REFRESH_COOKIE_NAME
  ];
  if (!token) throw AppError.unauthorized('No refresh token');

  const payload = (() => {
    try {
      return verifyRefreshToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  })();

  const user = await UserModel.findById(payload.sub);
  if (!user || user.isSuspended) throw AppError.unauthorized('Account not available');

  const accessToken = issueTokens(res, user);
  ok(res, { accessToken });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.authUser?.id);
  if (!user) throw AppError.notFound('User not found');
  ok(res, toUserDto(user));
});

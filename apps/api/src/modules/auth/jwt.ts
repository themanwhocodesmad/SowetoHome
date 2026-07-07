import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@soweto-stays/shared';
import { env } from '../../common/config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface RefreshTokenPayload {
  sub: string;
}

// @types/jsonwebtoken types `expiresIn` against the `ms` package's branded string literal
// type, which a plain env-sourced `string` doesn't structurally satisfy - cast at the boundary.
const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
};
const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

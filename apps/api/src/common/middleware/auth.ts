import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@soweto-stays/shared';
import { AppError } from '../errors/AppError.js';
import { verifyAccessToken } from '../../modules/auth/jwt.js';

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next(AppError.unauthorized('Missing bearer token'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.authUser = { id: payload.sub, roles: payload.roles, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

// Populates req.authUser when a valid token is present but never rejects - for public
// endpoints (e.g. property search) that only need to know identity if it's already there.
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.authUser = { id: payload.sub, roles: payload.roles, email: payload.email };
  } catch {
    // Ignore invalid/expired token - treat the request as unauthenticated.
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      next(AppError.unauthorized());
      return;
    }
    const authUser = req.authUser;
    const hasRole = roles.some((role) => authUser.roles.includes(role));
    if (!hasRole) {
      next(AppError.forbidden(`Requires one of roles: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

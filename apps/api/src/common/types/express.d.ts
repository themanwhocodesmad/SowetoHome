import type { Role } from '@soweto-stays/shared';

// Deliberately not named `user` to avoid colliding with Passport's own req.user,
// which is only meaningful transiently during the Google OAuth callback request.
// Every other authenticated request is stateless JWT, populated by common/middleware/auth.ts.
declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        roles: Role[];
        email: string;
      };
    }
  }
}

export {};

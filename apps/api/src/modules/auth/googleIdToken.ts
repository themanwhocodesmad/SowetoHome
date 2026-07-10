import { OAuth2Client } from 'google-auth-library';
import { env } from '../../common/config/env.js';
import { AppError } from '../../common/errors/AppError.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// GIS credential flow: the browser obtains a Google ID token client-side and POSTs it to
// us. Verifying its signature + audience needs only the client id - no client secret and
// no redirect/callback URL are involved anywhere in this flow.
const oauthClient = new OAuth2Client();

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, 'Google sign-in is not configured', 'OAUTH_NOT_CONFIGURED');
  }

  const ticket = await oauthClient
    .verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => {
      throw AppError.unauthorized('Invalid Google credential');
    });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw AppError.unauthorized('Google credential did not include an email address');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    avatarUrl: payload.picture ?? undefined,
  };
}

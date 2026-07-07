import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../common/config/env.js';
import { logger } from '../../common/logger.js';
import { userService } from '../users/user.service.js';

export function configurePassport(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    logger.warn('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set - Google sign-in is disabled');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          done(new Error('Google profile did not include an email address'));
          return;
        }

        userService
          .findOrCreateFromGoogleProfile({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          })
          .then((user) => {
            if (user.isSuspended) {
              done(new Error('This account has been suspended'));
              return;
            }
            done(null, user);
          })
          .catch((err: unknown) => done(err as Error));
      },
    ),
  );
}

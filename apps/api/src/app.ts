import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './common/config/env.js';
import { logger } from './common/logger.js';
import { errorHandler, notFoundHandler } from './common/errors/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { propertyRouter } from './modules/properties/property.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { payoutRouter } from './modules/payouts/payout.routes.js';
import { reviewRouter } from './modules/reviews/review.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { newsletterRouter } from './modules/newsletter/newsletter.routes.js';
import { siteContentRouter } from './modules/siteContent/siteContent.routes.js';

export function createApp(): Express {
  const app = express();

  // Exactly one reverse-proxy hop (Caddy) fronts us in production. Without this,
  // express-rate-limit would key every request on the proxy's IP - one shared bucket
  // for all users - and req.secure would ignore X-Forwarded-Proto.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  // Served directly by Express for now (disk storage per claude_plan.md §2) - a real deploy
  // puts Nginx in front of this path so uploads don't have to round-trip through Node.
  // helmet()'s default Cross-Origin-Resource-Policy: same-origin would otherwise make
  // browsers silently block <img> loads from the web app's origin (5173) against the
  // API's origin (4000) - curl doesn't enforce CORP, so this only shows up in a real browser.
  app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(path.resolve(env.UPLOAD_DIR)),
  );

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/properties', propertyRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/payouts', payoutRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/newsletter', newsletterRouter);
  app.use('/api/site-content', siteContentRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

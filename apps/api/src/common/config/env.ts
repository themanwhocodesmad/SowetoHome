import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// npm always runs a workspace's "dev"/"start" script with cwd set to that workspace
// (apps/api), regardless of how it's invoked - so two levels up is always the repo root,
// where docker-compose's env_file also points. In containers, real env vars are injected
// directly and this simply finds nothing to load.
loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  // Must be a publicly-reachable URL for PayFast's ITN webhook to reach in production;
  // localhost only works locally if tunnelled (e.g. ngrok) - see README.
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // GIS credential flow needs only the client id (as the ID-token audience) - there is no
  // client secret or callback URL. The same value is baked into the web bundle as
  // VITE_GOOGLE_CLIENT_ID. If unset, POST /api/auth/google responds 503.
  GOOGLE_CLIENT_ID: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_MERCHANT_KEY: z.string().optional(),
  PAYFAST_PASSPHRASE: z.string().optional(),
  PAYFAST_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYFAST_RETURN_URL: z.string().optional(),
  PAYFAST_CANCEL_URL: z.string().optional(),
  PAYFAST_NOTIFY_URL: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  // preprocess so an empty string in .env (rather than the var being absent) doesn't fail coercion
  SMTP_PORT: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('BookMyStay <no-reply@sowetostays.local>'),

  ADMIN_FEE_PERCENT: z.coerce.number().min(0).max(100).optional(),
  UPLOAD_DIR: z.string().default('uploads'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';

import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Same two-levels-up convention as apps/api/src/common/config/env.ts - both apps read the
// one root .env that docker-compose also uses, so there's a single source of truth.
loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  SMTP_HOST: z.string().optional(),
  // preprocess so an empty string in .env (rather than the var being absent) doesn't fail coercion
  SMTP_PORT: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Soweto Stays <no-reply@sowetostays.local>'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;

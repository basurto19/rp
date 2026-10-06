import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const required = ['MONGODB_URI', 'MONGODB_DB_NAME', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const parseNumber = (key: string, fallback: number): number => {
  const value = process.env[key];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber('PORT', 3000),
  apiVersion: process.env.API_VERSION ?? 'v1',
  mongodbUri: process.env.MONGODB_URI as string,
  mongodbDbName: process.env.MONGODB_DB_NAME as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  bcryptSaltRounds: parseNumber('BCRYPT_SALT_ROUNDS', 12),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? '',
  frontendUrl: process.env.FRONTEND_URL ?? '',
  adminEmail: (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(),
  rateLimitMax: parseNumber('RATE_LIMIT_MAX', 100),
  rateLimitWindowMs: parseNumber('RATE_LIMIT_WINDOW_MS', 900000),
};

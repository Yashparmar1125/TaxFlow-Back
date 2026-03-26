import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().describe('Database connection URL'),
  JWT_SECRET: z.string().min(10).describe('JWT Secret Key for Authentication'),
  JWT_REFRESH_SECRET: z.string().min(10).describe('JWT Refresh Secret Key'),
  ALLOWED_ORIGINS: z.string().default('*').describe('Comma separated list of allowed cors origins'),
  GOOGLE_CLIENT_ID: z.string().describe('Google OAuth Client ID'),
  GOOGLE_CLIENT_SECRET: z.string().describe('Google OAuth Client Secret'),
  GOOGLE_REDIRECT_URI: z.string().describe('Google OAuth Redirect URI'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional().describe('Path to service account JSON (for sharing logic)'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional().describe('Path to firebase service account JSON'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export default _env.data;

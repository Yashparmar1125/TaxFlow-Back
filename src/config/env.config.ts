import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url().describe('Database connection URL'),
  JWT_SECRET: z.string().min(10).describe('JWT Secret Key for Authentication'),
  ALLOWED_ORIGINS: z.string().default('*').describe('Comma separated list of allowed cors origins'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export default _env.data;

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(2, 'Full name is required'),
  }).strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }).strict(),
});

export const googleAuthSchema = z.object({
  body: z.object({
    id_token: z.string().nonempty('id_token is required'),
  }).strict(),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refresh_token: z.string().nonempty('refresh_token is required'),
  }).strict(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
  }).strict(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().nonempty('Reset token is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  }).strict(),
});

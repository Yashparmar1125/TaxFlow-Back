import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }).strict(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
  }).strict(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  }).strict(),
});

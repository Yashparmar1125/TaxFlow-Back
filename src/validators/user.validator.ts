import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).optional(),
    pan_masked: z.string().length(10, 'PAN must be 10 characters').optional(),
    sub_type: z.enum(['salaried', 'freelancer', 'professional']).optional(),
  }).strict(),
});

export const setupUserSchema = z.object({
  body: z.object({
    sub_type: z.enum(['salaried', 'freelancer', 'professional']),
  }).strict(),
});

export const updateFcmTokenSchema = z.object({
  body: z.object({
    fcm_token: z.string().min(1, 'FCM token is required'),
  }).strict(),
});

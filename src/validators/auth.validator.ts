import { z } from 'zod';
import { Role } from '@prisma/client';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }).strict(),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(1, 'Full name is required'),
    role: z.nativeEnum(Role),
    phone: z.string().optional(),
    firmId: z.string().uuid().optional(),
  }).strict(),
});

export const onboardingSchema = z.object({
  body: z.object({
    // Firm Details
    firm_name: z.string().min(1, 'Firm name is required'),
    registration_number: z.string().optional(),
    firm_phone: z.string().optional(),
    firm_email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    
    // User professional Details
    membership_id: z.string().min(1, 'ICAI number is required'),
    experience_years: z.number().int().min(0),
    bio: z.string().optional(),
    specializations: z.array(z.string()).default([]),
    avatar_url: z.string().optional(),
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

export const inviteClientSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    stakeholderType: z.string().min(1, 'Stakeholder type is required'),
  }).strict(),
});

export const claimInviteSchema = z.object({
  body: z.object({
    code: z.string().min(5).max(15),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
  }),
});

export const clientOnboardingSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format'),
    phone: z.string().nullish(),
    address: z.string().nullish(),
    stakeholderType: z.string(),
    businessName: z.string().nullish(),
    companyName: z.string().nullish(),
    gstin: z.string().nullish(),
    specialization: z.string().nullish(),
    investmentFocus: z.string().nullish(),
    riskLevel: z.string().nullish(),
    personalization: z.any().nullish(),
  }),
});

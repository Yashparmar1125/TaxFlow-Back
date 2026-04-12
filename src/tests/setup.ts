import { vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import prisma from '../config/prisma';

// Mock Prisma
vi.mock('../config/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-at-least-10-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-10-chars';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/callback';
process.env.ALLOWED_ORIGINS = '*';

// Mock other external services if necessary
vi.mock('../services/firebase.service', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: vi.fn(),
    }),
    messaging: () => ({
      send: vi.fn(),
    }),
  },
}));

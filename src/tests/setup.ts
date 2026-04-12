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
process.env.FIREBASE_SERVICE_ACCOUNT_PATH = 'secrets/firebase-mock.json';
process.env.FIREBASE_DATABASE_URL = 'https://mock.firebaseio.com';

// Global mock for firebase-admin to prevent initialization crashes
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn().mockReturnValue({}),
  },
  auth: vi.fn().mockReturnValue({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'mock-uid' }),
    getUser: vi.fn().mockResolvedValue({ uid: 'mock-uid', email: 'test@example.com' }),
  }),
  messaging: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue('mock-message-id'),
  }),
}));

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

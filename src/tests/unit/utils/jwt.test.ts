import { describe, it, expect, vi } from 'vitest';
import { generateToken, verifyToken } from '../../../utils/jwt';
import { Role } from '@prisma/client';

describe('JWT Utilities', () => {
  const userId = 'user-123';
  const role = Role.CLIENT;

  it('should generate a valid access token', () => {
    const token = generateToken(userId, 'access', role);
    expect(token).toBeDefined();
    
    const decoded = verifyToken(token, 'access');
    expect(decoded).toMatchObject({
      sub: userId,
      type: 'access',
      role: role
    });
  });

  it('should return null for invalid token type', () => {
    const token = generateToken(userId, 'refresh', role);
    const decoded = verifyToken(token, 'access');
    expect(decoded).toBeNull();
  });

  it('should return null for expired/invalid token', () => {
    const decoded = verifyToken('invalid-token', 'access');
    expect(decoded).toBeNull();
  });
});

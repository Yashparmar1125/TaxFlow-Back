import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../../utils/password';

describe('Password Utilities', () => {
  it('should hash and compare passwords correctly', async () => {
    const password = 'my-secret-password';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password);
    
    const isValid = await comparePassword(password, hashed);
    expect(isValid).toBe(true);
    
    const isInvalid = await comparePassword('wrong-password', hashed);
    expect(isInvalid).toBe(false);
  });
});

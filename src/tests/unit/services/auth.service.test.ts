import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../../services/auth.service';
import { prismaMock } from '../../setup';
import { Role } from '@prisma/client';
import * as passwordUtils from '../../../utils/password';
import * as jwtUtils from '../../../utils/jwt';

vi.mock('../../../utils/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../utils/jwt', () => ({
  generateToken: vi.fn().mockReturnValue('mock_token'),
  verifyToken: vi.fn(),
}));

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role: Role.CLIENT,
      };

      // Mock unique email check
      prismaMock.user.findUnique.mockResolvedValue(null as any);
      
      // Mock user creation
      const createdUser = {
        id: 'user-id',
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: true,
        is_onboarded: false,
      };
      prismaMock.user.create.mockResolvedValue(createdUser as any);
      
      // Mock refresh token storage
      prismaMock.refreshToken.create.mockResolvedValue({} as any);

      const result = await authService.register(userData);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(jwtUtils.generateToken).toHaveBeenCalledTimes(2); // Access and Refresh
      expect(result.user).toEqual(createdUser);
      expect(result.accessToken).toBe('mock_token');
    });

    it('should throw error if email already exists', async () => {
      const userData = { email: 'existing@example.com', password: 'password' };
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(authService.register(userData)).rejects.toThrow('Email is already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: 'user-id',
        email: credentials.email,
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: Role.CLIENT,
        is_active: true,
        is_onboarded: true,
        clientProfile: { id: 'profile-id' }
      };

      prismaMock.user.findUnique.mockResolvedValue(user as any);
      (passwordUtils.comparePassword as any).mockResolvedValue(true);
      prismaMock.refreshToken.create.mockResolvedValue({} as any);

      const result = await authService.login(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.accessToken).toBe('mock_token');
    });

    it('should throw error with incorrect password', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong_password' };
      prismaMock.user.findUnique.mockResolvedValue({ password_hash: 'hashed' } as any);
      (passwordUtils.comparePassword as any).mockResolvedValue(false);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens successfully', async () => {
      const oldToken = 'old_refresh_token';
      const decoded = { sub: 'user-id', type: 'refresh' };
      
      (jwtUtils.verifyToken as any).mockReturnValue(decoded);
      prismaMock.refreshToken.findUnique.mockResolvedValue({ id: 't1', userId: 'user-id', token: oldToken } as any);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-id', role: Role.CLIENT, is_active: true } as any);
      prismaMock.refreshToken.delete.mockResolvedValue({} as any);

      const result = await authService.refreshToken(oldToken);

      expect(prismaMock.refreshToken.delete).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock_token');
    });
  });

  describe('firebaseSync', () => {
    it('should sync existing user by email', async () => {
      const data = { firebaseUid: 'fb123', email: 'test@example.com', fullName: 'New Name' };
      prismaMock.user.findFirst.mockResolvedValue({ id: 'u1', email: 'test@example.com', role: Role.CLIENT } as any);
      prismaMock.user.update.mockResolvedValue({ id: 'u1', email: 'test@example.com', full_name: 'New Name', role: Role.CLIENT } as any);

      const result = await authService.firebaseSync(data);

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result.user.name).toBe('New Name');
    });
  });
});

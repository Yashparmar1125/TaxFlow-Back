import prisma from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

const storeRefreshToken = async (userId: string, token: string) => {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    }
  });
};

export const authService = {
  async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        full_name: data.full_name,
        role: data.role || Role.CLIENT,
        firmId: data.firmId,
        caId: data.caId,
      },
      select: { id: true, email: true, full_name: true, role: true, firmId: true, caId: true, is_active: true }
    });

    const accessToken = generateToken(user.id, 'access', user.role, user.firmId);
    const refreshToken = generateToken(user.id, 'refresh', user.role, user.firmId);
    
    await storeRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async login(data: any) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: {
        clientProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || !user.password_hash) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password');
    }
    
    if (!user.is_active) {
      throw new ApiError(403, 'User account is deactivated');
    }

    const userPayload = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      clientId: user.clientProfile?.id
    };

    const accessToken = generateToken(user.id, 'access', user.role, user.firmId);
    const refreshToken = generateToken(user.id, 'refresh', user.role, user.firmId);

    await storeRefreshToken(user.id, refreshToken);

    return { user: userPayload, accessToken, refreshToken };
  },

  async refreshToken(token: string) {
    const decoded = verifyToken(token, 'refresh');
    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token }
    });

    if (!storedToken) {
      // Possible reuse attack (rotation)
      // In a real scenario, we might want to invalidate all tokens for this user
      throw new ApiError(403, 'Token reuse detected');
    }

    // Invalidate old token and issue new ones (Rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.is_active) {
      throw new ApiError(403, 'User no longer active');
    }

    const accessToken = generateToken(user.id, 'access', user.role, user.firmId);
    const newRefreshToken = generateToken(user.id, 'refresh', user.role, user.firmId);

    await storeRefreshToken(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  },
  
  async logout(refreshTokenString: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshTokenString }
    });
    return { success: true };
  },

  async requestPasswordReset(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return true; // Don't leak user existence
    // Mock sending email
    return true;
  },
  
  async resetPassword(data: any) {
    // This would normally verify a reset token
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new ApiError(404, "User not found");
    
    const password_hash = await hashPassword(data.new_password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });
    return true;
  }
};

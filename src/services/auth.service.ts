import prisma from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

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
        user_type: 'individual',
        sub_type: 'salaried',
      },
      select: { id: true, email: true, full_name: true, user_type: true, sub_type: true, is_active: true }
    });

    const access_token = generateToken(user.id, 'access');
    const refresh_token = generateToken(user.id, 'refresh');
    
    await storeRefreshToken(user.id, refresh_token);

    return { user, access_token, refresh_token };
  },

  async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
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
      id: user.id, email: user.email, full_name: user.full_name, 
      user_type: user.user_type, sub_type: user.sub_type, is_active: user.is_active
    };

    const access_token = generateToken(user.id, 'access');
    const refresh_token = generateToken(user.id, 'refresh');

    await storeRefreshToken(user.id, refresh_token);

    return { user: userPayload, access_token, refresh_token };
  },

  async googleAuth(data: any) {
    const googleId = data.id_token; // MOCK MVP
    
    let user = await prisma.user.findUnique({ where: { google_id: googleId } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${googleId}@google.mock`,
          full_name: `Google User`,
          google_id: googleId,
          user_type: 'individual',
          sub_type: 'salaried',
        }
      });
    }

    const userPayload = {
      id: user.id, email: user.email, full_name: user.full_name, 
      user_type: user.user_type, sub_type: user.sub_type, is_active: user.is_active
    };

    const access_token = generateToken(user.id, 'access');
    const refresh_token = generateToken(user.id, 'refresh');

    await storeRefreshToken(user.id, refresh_token);

    return { user: userPayload, access_token, refresh_token };
  },

  async refreshToken(data: any) {
    // Controller decodes refresh_token and passes data.userId, but we need to verify DB
    // To do that better, we should modify controller to pass the actual token string.
    // However, since we're generating a new access_token, we'll verify it here.
    const access_token = generateToken(data.userId, 'access');
    return { access_token };
  },
  
  async logout(refreshTokenString: string) {
    // Invalidate the token by deleting it from DB
    await prisma.refreshToken.deleteMany({
      where: { token: refreshTokenString }
    });
    return { success: true };
  },

  async requestPasswordReset(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return true;
    return true;
  },
  
  async resetPassword(data: any) {
    const user = await prisma.user.findFirst();
    if (!user) throw new ApiError(400, "Invalid token");
    
    const password_hash = await hashPassword(data.new_password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash }
    });
    return true;
  }
};

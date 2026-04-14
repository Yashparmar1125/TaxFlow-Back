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
        phone: data.phone,
        firmId: data.firmId,
        caId: data.caId,
        is_onboarded: false,
      },
      select: { id: true, email: true, full_name: true, role: true, firmId: true, caId: true, phone: true, is_active: true, is_onboarded: true }
    });

    const accessToken = generateToken(user.id, 'access', user.role, user.firmId);
    const refreshToken = generateToken(user.id, 'refresh', user.role, user.firmId);
    
    await storeRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async verifyInvite(code: string, email: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { code },
      include: { ca: { select: { full_name: true, firm: { select: { name: true } } } } }
    });

    if (!invitation) throw new ApiError(404, 'Invalid invite code');
    if (invitation.status !== 'pending') throw new ApiError(400, 'Invite already used');
    if (invitation.expiresAt < new Date()) throw new ApiError(400, 'Invite expired');
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new ApiError(400, 'This invite was issued to a different email address');
    }

    return {
      name: invitation.name,
      caName: invitation.ca.full_name,
      firmName: invitation.ca.firm?.name || 'TaxPro Practice',
      stakeholderType: invitation.stakeholderType,
    };
  },

  async registerByInvite(data: any) {
    const { code, password, email } = data;

    const invitation = await prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation || invitation.status !== 'pending' || invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new ApiError(400, 'Invalid or expired invitation');
    }

    const hashedPassword = await hashPassword(password);

    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          password_hash: hashedPassword,
          full_name: invitation.name,
          role: Role.CLIENT,
          caId: invitation.caId,
          phone: invitation.phone,
        }
      });

      // 2. Mark Invitation as Accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });

      const accessToken = generateToken(user.id, 'access', user.role);
      const refreshToken = generateToken(user.id, 'refresh', user.role);
      await storeRefreshToken(user.id, refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isOnboarded: false, 
        },
        accessToken,
        refreshToken,
      };
    });
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
      clientId: user.clientProfile?.id,
      isOnboarded: user.is_onboarded,
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
  },

  async firebaseSync(data: any) {
    const { firebaseUid, email, fullName, avatarUrl, fcmToken, role, inviteCode } = data;

    // 1. Find or Create User
    let user = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { firebaseUid: firebaseUid },
          { email: email }
        ]
      },
      include: { clientProfile: { select: { id: true } } }
    });

    let caId: string | null = null;
    let firmId: string | null = null;

    // 0. Pre-process invitation if code is provided
    if (inviteCode) {
      const invite = await prisma.invitation.findFirst({
        where: { code: inviteCode, email, status: 'pending' },
        include: { ca: true }
      });

      if (invite) {
        caId = invite.caId;
        firmId = invite.ca.firmId;
        
        // Mark as accepted
        await prisma.invitation.update({
          where: { id: invite.id },
          data: { status: 'accepted' }
        });
      }
    }

    if (!user) {
      // Register New User
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          full_name: fullName || email.split('@')[0],
          role: role as Role,
          caId,
          firmId,
          is_onboarded: false,
        } as any,
        include: { 
          clientProfile: { 
            include: {
              ca: { select: { full_name: true } },
              firm: { select: { name: true } }
            }
          }
        }
      });
    } else {
      // Sync Existing User
      user = await (prisma as any).user.update({
        where: { id: (user as any).id },
        data: {
          firebaseUid: (user as any).firebaseUid || firebaseUid,
          full_name: (user as any).full_name || fullName,
          avatar_url: (user as any).avatar_url || avatarUrl,
          fcm_token: fcmToken || (user as any).fcm_token,
          // Update CA only if we have a valid invite
          caId: caId || (user as any).caId,
          firmId: firmId || (user as any).firmId,
        },
        include: { 
          clientProfile: { 
            include: {
              ca: { select: { full_name: true } },
              firm: { select: { name: true } }
            }
          }
        }
      });
    }

    const userPayload = {
      id: (user as any).id,
      name: (user as any).full_name,
      email: (user as any).email,
      role: (user as any).role,
      firmId: (user as any).firmId,
      clientId: (user as any).clientProfile?.id,
      isOnboarded: (user as any).is_onboarded,
      caName: (user as any).clientProfile?.ca?.full_name,
      firmName: (user as any).clientProfile?.firm?.name,
    };

    const accessToken = generateToken((user as any)!.id, 'access', (user as any)!.role, (user as any)!.firmId);
    const refreshToken = generateToken((user as any)!.id, 'refresh', (user as any)!.role, (user as any)!.firmId);

    await storeRefreshToken((user as any)!.id, refreshToken);

    return { user: userPayload, accessToken, refreshToken };
  }
};

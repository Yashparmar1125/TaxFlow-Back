import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clientProfile: {
            include: {
              ca: { select: { full_name: true } },
              firm: { select: { name: true } }
            }
          }
        }
      });

      if (!user) throw new ApiError(404, 'User not found');

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            firmId: user.firmId,
            caId: user.caId,
            fcmToken: user.fcm_token,
            isActive: user.is_active,
            isOnboarded: user.is_onboarded,
            clientId: user.clientProfile?.id,
            caName: user.clientProfile?.ca?.full_name,
            firmName: user.clientProfile?.firm?.name
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const { name, phone, fcmToken } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          full_name: name,
          fcm_token: fcmToken,
          ...(req.user?.role === 'CLIENT' && phone ? {
            clientProfile: {
              update: { phone }
            }
          } : {})
        },
        include: {
          clientProfile: true
        }
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
            firmId: updatedUser.firmId,
            fcmToken: updatedUser.fcm_token,
            clientId: updatedUser.clientProfile?.id
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
      }
    });

    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  async updateProfile(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
      }
    });
    return user;
  },

  async setup(userId: string) {
    // Generate FY tasks placeholder logic
    const tasksCreatedCount = 5; // Placeholder
    return { tasks_created: tasksCreatedCount };
  },

  async updateFcmToken(userId: string, fcm_token: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcm_token }
    });
    return { success: true };
  }
};

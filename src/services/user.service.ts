import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { TaskService } from './task.service';

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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');
    
    let tasksCreated = 0;
    if (user.role === 'CA') {
      // CA doesn't need personal tasks generated in this way usually, 
      // but maybe we want to setup their default rules?
    } else {
      const client = await prisma.clientProfile.findUnique({ where: { userId } });
      if (client && user.caId) {
         // Auto-generate for current FY
         const currentFY = TaskService.getCurrentFY();
         const existing = await prisma.complianceTask.findFirst({
           where: { clientId: client.id, fy: currentFY }
         });
         if (!existing) {
           await TaskService.initializeForClient(client.id, client.stakeholderType || 'Other', user.caId);
           tasksCreated = 1; // Simplification (it creates a set of tasks)
         }
      }
    }
    return { tasks_created: tasksCreated };
  },

  async updateFcmToken(userId: string, fcm_token: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcm_token }
    });
    return { success: true };
  }
};

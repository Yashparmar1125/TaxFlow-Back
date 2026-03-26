import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export class NotificationService {
  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async markRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  static async createNotification(userId: string, title: string, body: string, type: any = 'TASK_CREATED', metadata: any = {}) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        refId: metadata?.refId,
        refType: metadata?.refType
      }
    });
  }
}

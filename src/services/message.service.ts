import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

export class MessageService {
  static async getThreads(userId: string, role: string) {
    const where = role === Role.CA ? { caId: userId } : { clientId: userId };
    return prisma.messageThread.findMany({
      where,
      include: {
        client: role === Role.CA ? true : false,
        ca: role === Role.CLIENT ? true : false,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }

  static async getMessages(threadId: string, userId: string, role: string) {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new ApiError(404, 'Thread not found');
    
    // Verify access
    if (role === Role.CA && thread.caId !== userId) throw new ApiError(403, 'Forbidden');
    // For clients, we need to resolve their profile first
    if (role === Role.CLIENT) {
      const profile = await prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || thread.clientId !== profile.id) throw new ApiError(403, 'Forbidden');
    }

    return prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async sendMessage(userId: string, role: Role, threadId: string, content: string) {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new ApiError(404, 'Thread not found');

    // Verify access
    if (role === Role.CA && thread.caId !== userId) throw new ApiError(403, 'Forbidden');
    if (role === Role.CLIENT) {
      const profile = await prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || thread.clientId !== profile.id) throw new ApiError(403, 'Forbidden');
    }

    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          threadId,
          senderId: userId,
          senderRole: role,
          content
        }
      });

      const updateData: any = {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 80)
      };

      if (role === Role.CA) {
        updateData.unreadCountClient = { increment: 1 };
      } else {
        updateData.unreadCountCA = { increment: 1 };
      }

      await tx.messageThread.update({
        where: { id: threadId },
        data: updateData
      });

      return message;
    });
  }
}

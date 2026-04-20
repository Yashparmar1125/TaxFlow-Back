import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';
import { firebaseService } from './firebase.service';

export class MessageService {
  static async getThreads(userId: string, role: string) {
    let where: any;
    
    if (role === Role.CA) {
      where = { caId: userId };
    } else {
      const profile = await prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile) return []; // No profile, no threads
      where = { clientId: profile.id };
    }

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

  static async getMessages(id: string, userId: string, role: string) {
    let thread = await prisma.messageThread.findUnique({ where: { id } });
    
    if (!thread) {
      // Maybe it's a taskId?
      const task = await prisma.complianceTask.findUnique({ where: { id } });
      if (!task) throw new ApiError(404, 'Task or Thread not found');

      // Check if this user has access to the task
      if (role === Role.CA && task.caId !== userId) throw new ApiError(403, 'Forbidden');
      if (role === Role.CLIENT) {
        const profile = await prisma.clientProfile.findUnique({ where: { userId } });
        if (!profile || task.clientId !== profile.id) throw new ApiError(403, 'Forbidden');
      }

      // Find the thread linked to this task
      thread = await prisma.messageThread.findFirst({
        where: { taskId: task.id }
      });

      if (!thread) return []; // No messages yet, so no thread exists
    }
    
    // Verify access to the found thread
    if (role === Role.CA && thread.caId !== userId) throw new ApiError(403, 'Forbidden');
    if (role === Role.CLIENT) {
      const profile = await prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || thread.clientId !== profile.id) throw new ApiError(403, 'Forbidden');
    }

    return prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async sendMessage(userId: string, role: Role, taskIdOrThreadId: string, content: string) {
    let threadId = taskIdOrThreadId;
    let taskId: string | null = null;

    // Try to find thread by ID first
    let thread = await prisma.messageThread.findUnique({ where: { id: taskIdOrThreadId } });

    if (!thread) {
       // If not found by ID, treat it as a taskId and find/create the link
       const task = await prisma.complianceTask.findUnique({ where: { id: taskIdOrThreadId } });
       if (!task) throw new ApiError(404, 'Task or Thread not found');
       
       taskId = task.id;
       thread = await prisma.messageThread.findFirst({
         where: {
           caId: task.caId,
           clientId: task.clientId,
           taskId: task.id
         }
       });

       if (!thread) {
         thread = await prisma.messageThread.create({
           data: {
             caId: task.caId,
             clientId: task.clientId,
             taskId: task.id,
             lastMessagePreview: content.substring(0, 80)
           }
         });
       }
       threadId = thread.id;
    }

    // Verify access
    if (role === Role.CA && thread.caId !== userId) throw new ApiError(403, 'Forbidden');
    if (role === Role.CLIENT) {
      const profile = await prisma.clientProfile.findUnique({ where: { userId } });
      if (!profile || thread.clientId !== profile.id) throw new ApiError(403, 'Forbidden');
    }

    const result = await prisma.$transaction(async (tx) => {
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

    // Sync to Firebase RTDB for real-time updates (Non-blocking)
    firebaseService.syncMessage(threadId, result).catch(err => 
      console.error('Failed to sync to Firebase RTDB:', err)
    );

    return result;
  }
}

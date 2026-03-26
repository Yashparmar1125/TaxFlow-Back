import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { Role, TaskStatus } from '@prisma/client';

export class CAService {
  static async getDashboard(caId: string) {
    const [clientsCount, tasks, messages] = await Promise.all([
      prisma.clientProfile.count({ where: { caId } }),
      prisma.complianceTask.findMany({ where: { caId } }),
      prisma.messageThread.findMany({ 
        where: { caId },
        select: { unreadCountCA: true }
      })
    ]);

    const stats = {
      totalClients: clientsCount,
      pendingTasks: tasks.filter((t: any) => t.status === TaskStatus.pending).length,
      inReviewTasks: tasks.filter((t: any) => t.status === TaskStatus.in_review).length,
      overdueTasks: tasks.filter((t: any) => t.status === TaskStatus.overdue).length,
      unreadMessages: messages.reduce((acc: number, m: any) => acc + m.unreadCountCA, 0)
    };

    const recentDeadlines = tasks
      .filter((t: any) => t.status !== TaskStatus.approved)
      .sort((a: any, b: any) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);

    return { stats, recentDeadlines };
  }

  static async getClients(caId: string, query: any) {
    const { search, skip = 0, take = 10 } = query;
    const where: any = { caId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { pan: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.clientProfile.findMany({
      where,
      skip: Number(skip),
      take: Number(take),
      orderBy: { name: 'asc' }
    });
  }

  static async createClient(caId: string, data: any) {
    const { email, password, name, pan, phone, address } = data;

    // 1. Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(400, 'User already exists');

    // 2. Create User + Profile in Transaction
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          full_name: name,
          role: Role.CLIENT,
          caId
        }
      });

      const profile = await tx.clientProfile.create({
        data: {
          userId: user.id,
          caId,
          name,
          pan,
          phone,
          address,
          driveFolder: `client_${user.id}` // Default structure, updated when they connect Drive
        }
      });

      return { user, profile };
    });
  }

  static async getClientById(caId: string, clientId: string) {
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        documents: { orderBy: { uploadedAt: 'desc' }, take: 5 }
      }
    });

    if (!client || client.caId !== caId) {
      throw new ApiError(404, 'Client not found');
    }

    return client;
  }
}

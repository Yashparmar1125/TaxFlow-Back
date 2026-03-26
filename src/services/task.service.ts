import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { TaskStatus, Role } from '@prisma/client';
import { addDays } from 'date-fns';

export class TaskService {
  static async createTask(caId: string, data: any) {
    return prisma.complianceTask.create({
      data: {
        ...data,
        caId,
        status: TaskStatus.pending,
        dueDate: new Date(data.dueDate),
        fy: data.fy || '2025-26'
      }
    });
  }

  static async updateTask(caId: string, taskId: string, data: any) {
    const task = await prisma.complianceTask.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, 'Task not found');
    if (task.caId !== caId) throw new ApiError(403, 'Forbidden');

    return prisma.complianceTask.update({
      where: { id: taskId },
      data
    });
  }

  static async deleteTask(caId: string, taskId: string) {
    const task = await prisma.complianceTask.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, 'Task not found');
    if (task.caId !== caId) throw new ApiError(403, 'Forbidden');

    await prisma.complianceTask.delete({ where: { id: taskId } });
    return { success: true };
  }

  static async generateFYTasks(caId: string, fy: string, force: boolean = false) {
    const [startYear] = fy.split('-');
    const fyEnd = new Date(Number(startYear) + 1, 2, 31);

    if (!force) {
      const existing = await prisma.complianceTask.findFirst({
        where: { caId, fy }
      });
      if (existing) throw new ApiError(409, 'Tasks for this FY already generated');
    }

    const [rules, clients] = await Promise.all([
      prisma.complianceRule.findMany({ where: { caId, isActive: true } }),
      prisma.clientProfile.findMany({ where: { caId } })
    ]);

    let tasksCreated = 0;
    for (const client of clients) {
      for (const rule of rules) {
        await prisma.complianceTask.create({
          data: {
            caId,
            clientId: client.id,
            ruleId: rule.id,
            fy,
            title: `${rule.title} - ${fy}`,
            taskType: rule.taskType,
            dueDate: addDays(fyEnd, rule.dueDaysFromFYEnd),
            documentChecklist: rule.documentChecklist,
            status: TaskStatus.pending
          }
        });
        tasksCreated++;
      }
    }

    return { tasksCreated, clientsProcessed: clients.length };
  }

  static async getClientTask(userId: string, taskId: string) {
    const profile = await prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) throw new ApiError(403, 'Not a client');

    const task = await prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } }
      }
    });

    if (!task) throw new ApiError(404, 'Task not found');
    if (task.clientId !== profile.id) throw new ApiError(403, 'Forbidden');

    return task;
  }

  static async getClientDashboard(userId: string) {
    const profile = await prisma.clientProfile.findUnique({ 
      where: { userId },
      include: { threads: { select: { unreadCountClient: true } } }
    });
    if (!profile) throw new ApiError(403, 'Not a client');

    const tasks = await prisma.complianceTask.findMany({
      where: { clientId: profile.id }
    });

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t: any) => t.status === TaskStatus.pending).length,
      inReview: tasks.filter((t: any) => t.status === TaskStatus.in_review).length,
      approved: tasks.filter((t: any) => t.status === TaskStatus.approved).length,
      overdue: tasks.filter((t: any) => t.status === TaskStatus.overdue).length,
    };

    const upcoming = await prisma.complianceTask.findMany({
      where: { clientId: profile.id, status: { not: TaskStatus.approved } },
      orderBy: { dueDate: 'asc' },
      take: 3
    });

    const unread = profile.threads.reduce((acc: number, t: any) => acc + t.unreadCountClient, 0);

    return { stats, upcoming, unread };
  }
}

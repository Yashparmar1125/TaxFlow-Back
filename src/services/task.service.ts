import prisma from '../config/prisma';
import { TaskType, TaskStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { addDays, endOfYear, startOfYear, format } from 'date-fns';

export class TaskService {
  /**
   * Initializes compliance tasks for a newly onboarded client
   * based on their professional context (stakeholderType).
   */
  static async initializeForClient(clientId: string, stakeholderType: string, caId: string, tx: any = prisma) {
    const fy = this.getCurrentFY();
    const templateTasks = this.getTemplateForStakeholder(stakeholderType, fy);
    
    // 1. Fetch custom rules defined by CA
    const customRules = await tx.complianceRule.findMany({
      where: { caId, isActive: true }
    });

    // 2. Map custom rules to task objects
    const currentYear = new Date().getFullYear();
    const ruleTasks = customRules.map((rule: any) => ({
      title: rule.title,
      type: rule.taskType,
      // Calculate due date based on FY end (usually March 31st)
      dueDate: new Date(currentYear, 2, 31 + rule.dueDaysFromFYEnd),
      description: `Custom rule compliance: ${rule.title}`,
      checklist: rule.documentChecklist,
    }));

    // 3. Merge and create
    const allTasks = [...templateTasks, ...ruleTasks];

    return tx.complianceTask.createMany({
      data: allTasks.map(task => ({
        clientId,
        caId,
        fy,
        title: task.title,
        taskType: task.type,
        status: TaskStatus.pending,
        dueDate: (task as any).dueDate,
        description: (task as any).description,
        documentChecklist: (task as any).checklist,
      }))
    });
  }

  static async createTask(caId: string, data: any) {
    return prisma.complianceTask.create({
      data: {
        ...data,
        caId,
        status: data.status || TaskStatus.pending
      }
    });
  }

  static async updateTask(caId: string, taskId: string, data: any) {
    // Ensure the CA owns this task/client
    return prisma.complianceTask.update({
      where: { id: taskId, caId },
      data
    });
  }

  static async deleteTask(caId: string, taskId: string) {
    await prisma.complianceTask.delete({
      where: { id: taskId, caId }
    });
    return { message: 'Task deleted successfully' };
  }

  static async generateFYTasks(caId: string, fy: string, force: boolean) {
    const clients = await prisma.clientProfile.findMany({
      where: { caId }
    });

    let createdCount = 0;
    for (const client of clients) {
      // Check if tasks already exist for this FY
      if (!force) {
        const existing = await prisma.complianceTask.findFirst({
          where: { clientId: client.id, fy }
        });
        if (existing) continue;
      }

      await this.initializeForClient(client.id, client.stakeholderType || 'Other', caId);
      createdCount++;
    }

    return { message: `Generated tasks for ${createdCount} clients.` };
  }

  static async getClientTask(userId: string, taskId: string) {
    const task = await prisma.complianceTask.findFirst({
      where: {
        id: taskId,
        client: { userId }
      },
      include: {
        documents: true,
        ca: {
          select: {
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  }

  static async getClientDashboard(userId: string) {
    const client = await prisma.clientProfile.findUnique({
      where: { userId }
    });
    if (!client) throw new ApiError(404, 'Client profile not found');

    const [stats, upcoming, unreadThread] = await Promise.all([
      prisma.complianceTask.groupBy({
        by: ['status'],
        where: { clientId: client.id },
        _count: true
      }),
      prisma.complianceTask.findMany({
        where: {
          clientId: client.id,
          status: { in: [TaskStatus.pending, TaskStatus.overdue] }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      prisma.messageThread.findFirst({
        where: { clientId: client.id },
        select: { unreadCountClient: true }
      })
    ]);

    const formattedStats = stats.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    return {
      stats: formattedStats,
      upcoming,
      unread: unreadThread?.unreadCountClient || 0
    };
  }

  static async getCATasks(caId: string, filters: { status?: TaskStatus, clientId?: string }) {
    return prisma.complianceTask.findMany({
      where: {
        caId,
        ...(filters.status && { status: filters.status }),
        ...(filters.clientId && { clientId: filters.clientId })
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  static async getCATaskById(caId: string, taskId: string) {
    const task = await prisma.complianceTask.findFirst({
      where: { id: taskId, caId },
      include: {
        documents: true,
        client: {
          select: {
            id: true,
            name: true,
            pan: true,
            phone: true,
            businessName: true,
            stakeholderType: true
          }
        },
        messageThreads: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  }

  static getCurrentFY(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 is Jan)
    
    // Financial year in India starts from April
    if (month >= 3) {
      return `FY${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `FY${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
    }
  }

  private static getTemplateForStakeholder(type: string, fy: string) {
    const yearEnd = new Date(new Date().getFullYear(), 2, 31); // March 31st
    
    switch (type) {
      case 'Salaried Employee':
        return [
          {
            title: `Income Tax Return (ITR-1) - ${fy}`,
            type: TaskType.ITR,
            dueDate: new Date(new Date().getFullYear(), 6, 31), // July 31st
            description: 'Annual Income Tax filing for salaried individuals.',
            checklist: ['Form 16', 'Interest Certificates', '80C Proofs', 'PAN Card']
          },
          {
            title: `Advance Tax - Q3 ${fy}`,
            type: TaskType.ADVANCE_TAX,
            dueDate: new Date(new Date().getFullYear(), 11, 15), // Dec 15th
            description: 'Quarterly Advance Tax installment.',
            checklist: ['Income Statement', 'Investment Proofs']
          }
        ];

      case 'Business Owner / Proprietor':
      case 'Professional (Doctor/CA/Lawyer)':
      case 'Freelancer / Self-Employed':
        return [
          {
            title: `ITR Filing (ITR-3/4) - ${fy}`,
            type: TaskType.ITR,
            dueDate: new Date(new Date().getFullYear(), 6, 31),
            description: 'Annual Income Tax filing for Business/Professional income.',
            checklist: ['Bank Statements', 'P&L Statement', 'Balance Sheet', 'GST Returns Summary']
          },
          {
            title: `Monthly GST Return - M1`,
            type: TaskType.GST_RETURN,
            dueDate: addDays(new Date(), 20),
            description: 'Monthly GSTR-3B and GSTR-1 filing.',
            checklist: ['Sales Register', 'Purchase Register']
          },
          {
            title: `Advance Tax Installment`,
            type: TaskType.ADVANCE_TAX,
            dueDate: new Date(new Date().getFullYear(), 5, 15),
            description: 'First installment of Advance Tax.',
            checklist: ['Estimated Income Sheet']
          }
        ];

      case 'HNI / Investor':
        return [
          {
            title: `Wealth Tax & ITR - ${fy}`,
            type: TaskType.ITR,
            dueDate: new Date(new Date().getFullYear(), 6, 31),
            description: 'Complex ITR filing with foreign assets/capital gains.',
            checklist: ['Capital Gains Statement', 'Foreign Asset Details', 'Dividend Income']
          }
        ];

      default:
        return [
          {
            title: `Generic Compliance Review - ${fy}`,
            type: TaskType.OTHER,
            dueDate: addDays(new Date(), 30),
            description: 'Baseline compliance check for your profile.',
            checklist: ['PAN Card', 'Last Year ITR']
          }
        ];
    }
  }
}

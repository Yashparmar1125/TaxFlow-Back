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
    const currentYear = new Date().getFullYear();
    
    // Default tasks relative to March 31st (FY End)
    const baseTasks = [
      {
        title: `FY Tax Planning & Estimates - ${fy}`,
        type: TaskType.OTHER,
        dueDate: new Date(currentYear, 2, 15), // March 15
        description: 'Finalize tax savings and advance tax estimates.',
        checklist: ['Investment Proofs', 'Bank Statements']
      }
    ];

    switch (type) {
      case 'Salaried Employee':
        return [
          ...baseTasks,
          {
            title: `Income Tax Return (ITR-1) - ${fy}`,
            type: TaskType.ITR,
            dueDate: new Date(currentYear, 6, 31), // July 31
            description: 'Individual income tax return filing.',
            checklist: ['Form 16', 'Form 26AS', 'Interest Certificates']
          }
        ];

      case 'Professional (Doctor/CA/Lawyer)':
      case 'Freelancer / Self-Employed':
        return [
          ...baseTasks,
          {
            title: `Income Tax Return (ITR-3/4) - ${fy}`,
            type: TaskType.ITR,
            dueDate: new Date(currentYear, 6, 31),
            description: 'Business/Professional income tax return.',
            checklist: ['Profit & Loss Statement', 'Balance Sheet', 'Expense Receipts']
          },
          {
            title: `Audit Readiness Check - ${fy}`,
            type: TaskType.AUDIT,
            dueDate: new Date(currentYear, 8, 30), // Sept 30
            description: 'Initial review for audit requirements.',
            checklist: ['Books of Accounts', 'Vouchers']
          }
        ];

      case 'Business Owner / Proprietor':
        return [
          ...baseTasks,
          {
            title: `Annual GST Reconciliation - ${fy}`,
            type: TaskType.GST_RETURN,
            dueDate: new Date(currentYear, 11, 31), // Dec 31
            description: 'Finalize GSTR-9/9C for the previous year.',
            checklist: ['GSTR-2A vs Purchase Register', 'GSTR-3B Summary']
          },
          {
            title: `Statutory Audit - ${fy}`,
            type: TaskType.AUDIT,
            dueDate: new Date(currentYear, 8, 30),
            description: 'Complete mandatory statutory audit.',
            checklist: ['Bank Reconciliations', 'Fixed Asset Register', 'Stock Summary']
          }
        ];

      case 'HNI / Investor':
        return [
          ...baseTasks,
          {
            title: `Capital Gains Report - ${fy}`,
            type: TaskType.OTHER,
            dueDate: new Date(currentYear, 4, 31), // May 31
            description: 'Compute short-term and long-term capital gains.',
            checklist: ['Trading Statements', 'Property Sale Deed', 'Crypto Transaction Logs']
          }
        ];

      default:
        return [
          ...baseTasks,
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

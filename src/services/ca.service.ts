import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { Role, TaskStatus } from '@prisma/client';
import { hashPassword } from '../utils/password';

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

  static async inviteClient(caId: string, data: any) {
    const { email, name, phone, stakeholderType } = data;

    // 1. Check if an active user or invitation already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    // If user exists and is a CA, we shouldn't allow them to be invited as a client
    if (existingUser && existingUser.role === Role.CA) {
      throw new ApiError(400, 'This email is already registered as a CA');
    }

    // Check if an invitation already exists (any status) for this user to this CA
    // This allows re-retrieving the code if the client is already linked or invited.
    const recentInvite = await prisma.invitation.findFirst({
      where: { email, caId },
      orderBy: { createdAt: 'desc' }
    });
    
    // If there is an active (pending) invite, or they are already linked via an invite
    if (recentInvite && (recentInvite.status === 'pending' || (existingUser && existingUser.caId === caId))) {
       return recentInvite;
    }

    // If they are linked to another CA, we don't allow re-inviting for now (security/policy)
    if (existingUser && existingUser.caId && existingUser.caId !== caId) {
       throw new ApiError(403, 'This user is already linked to another CA or Firm');
    }

    // 2. Generate unique alphanumeric code (e.g., TF-X7Y2Z9)
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
      let code = 'TF-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let inviteCode = generateCode();
    // Ensure uniqueness (rare collision but safe)
    let isUnique = false;
    while (!isUnique) {
      const collision = await prisma.invitation.findUnique({ where: { code: inviteCode } });
      if (!collision) isUnique = true;
      else inviteCode = generateCode();
    }

    // 3. Create Invitation
    const invitation = await prisma.invitation.create({
      data: {
        code: inviteCode,
        email,
        phone,
        name,
        stakeholderType,
        caId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    return invitation;
  }

  static async onboarding(caId: string, data: any) {
    const { 
      firm_name, registration_number, firm_phone, firm_email, address, city, state,
      membership_id, experience_years, bio, specializations, avatar_url 
    } = data;

    return prisma.$transaction(async (tx: any) => {
      // 0. Get current CA details for defaults
      const ca = await tx.user.findUnique({ where: { id: caId } });
      if (!ca) throw new ApiError(404, 'CA not found');

      // 1. Create or update Firm
      const firm = await tx.firm.create({
        data: {
          name: firm_name,
          registration_number,
          phone: firm_phone || ca.phone, // Default to user's phone
          email: firm_email || ca.email, // Default to user's email
          address: `${address || ''}, ${city}, ${state}`.trim(),
        }
      });

      const user = await tx.user.update({
        where: { id: caId },
        data: {
          firmId: firm.id,
          membership_id,
          experience_years,
          bio,
          specializations,
          is_onboarded: true,
          avatar_url: avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${caId}` // Mock avatar
        }
      });

      return { user, firm };
    });
  }

  static async getProfile(caId: string) {
    const user = await (prisma as any).user.findUnique({
      where: { id: caId },
      include: { firm: true }
    });

    if (!user) throw new ApiError(404, 'CA Profile not found');

    return user;
  }

  static async getClientById(caId: string, clientId: string) {
    const client = await prisma.clientProfile.findFirst({
      where: { id: clientId, caId },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
            phone: true
          }
        }
      }
    });

    if (!client) throw new ApiError(404, 'Client not found');
    return client;
  }

  static async updateClient(caId: string, clientId: string, data: any) {
    return prisma.clientProfile.update({
      where: { id: clientId, caId },
      data
    });
  }

  static async getClientDocuments(caId: string, clientId: string) {
    const documents = await prisma.document.findMany({
      where: { clientId, caId },
      orderBy: { uploadedAt: 'desc' }
    });
    return documents;
  }
}

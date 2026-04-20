import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { TaskService } from './task.service';
import { driveService } from './drive.service';


export class ClientService {
  /**
   * Links a user to a CA using an invitation code. Supports session-based (userId) 
   * or identity-based (email/phone) linking for public endpoints.
   */
  static async claimInvite(identifier: { userId?: string, email?: string, phone?: string | null }, code: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation) throw new ApiError(404, 'Invalid invite code');

    // Idempotency check: If invitation is already accepted, check if it's by THIS user
    if (invitation.status !== 'pending') {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (user && user.caId === invitation.caId) {
        return { success: true, caId: invitation.caId, message: 'Already linked' };
      }
      throw new ApiError(400, 'Invite already used');
    }
    if (invitation.expiresAt < new Date()) throw new ApiError(400, 'Invite expired');

    // Verification: If the invite was specifically issued to an email/phone, 
    // the claimant MUST provide matching details or be the user it was issued to.
    if (identifier.email && 
        invitation.email && 
        invitation.email.toLowerCase() !== identifier.email.toLowerCase()) {
       throw new ApiError(403, `This code was issued to ${invitation.email}. Please use that email to claim.`);
    }

    let targetUserId = identifier.userId;

    // Resolve userId via email if session is missing
    if (!targetUserId && identifier.email) {
      const user = await prisma.user.findUnique({ where: { email: identifier.email.toLowerCase() } });
      if (!user) throw new ApiError(404, 'No user found with this email. Please register first.');
      targetUserId = user.id;
    }

    if (!targetUserId) throw new ApiError(400, 'User identification required to claim invite');

    return prisma.$transaction(async (tx) => {
      // 1. Link User to CA
      await tx.user.update({
        where: { id: targetUserId },
        data: { caId: invitation.caId }
      });

      // 2. Mark Invitation as Accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });

      // 3. Link Profile (Handshake)
      // This ensures the CA sees the client in their list immediately, 
      // even if the client hasn't finished full onboarding yet.
      await tx.clientProfile.upsert({
        where: { userId: targetUserId },
        update: { caId: invitation.caId },
        create: {
          userId: targetUserId,
          caId: invitation.caId,
          name: invitation.name,
          phone: invitation.phone,
          stakeholderType: invitation.stakeholderType
        }
      });

      return { success: true, caId: invitation.caId };
    });
  }

  /**
   * Completes the user profile and marks them as onboarded.
   */
  static async completeOnboarding(userId: string, data: any) {
    const { 
      name, 
      pan, 
      phone, 
      address, 
      stakeholderType, 
      businessName, 
      companyName, 
      gstin, 
      specialization, 
      investmentFocus,
      riskLevel,
      personalization 
    } = data;

    const user = await (prisma as any).user.findUnique({ 
      where: { id: userId }
    });
    if (!user) throw new ApiError(404, 'User not found');

    let folderId = `client_${userId}`; // Fallback string
    
    // Create actual folder if Google is connected
    if (user.googleAccessToken && user.caId) {
       try {
         const caUser = await (prisma as any).user.findUnique({ where: { id: user.caId }, select: { email: true } });
         if (caUser?.email) {
            folderId = await driveService.createFolderForClient(userId, `Compliance - ${name || user.full_name}`, caUser.email);
         }
       } catch (e) {
         console.error('Failed to create Drive folder, falling back to string ID', e);
       }
    }


    return prisma.$transaction(async (tx) => {
      // 1. Create or Update Client Profile
      const profile = await tx.clientProfile.upsert({
        where: { userId },
        update: {
          name,
          pan,
          phone,
          address,
          stakeholderType,
          businessName,
          companyName,
          gstin,
          specialization,
          investmentFocus,
          personalization,
          driveFolder: folderId,
          caId: (user.caId as any) || null,
        },
        create: {
          userId,
          caId: (user.caId as any) || null,
          name,
          pan,
          phone,
          address,
          stakeholderType,
          businessName,
          companyName,
          gstin,
          specialization,
          investmentFocus,
          personalization,
          driveFolder: folderId,
        }
      });

      // 2. Mark as onboarded
      await tx.user.update({
        where: { id: userId },
        data: { is_onboarded: true } as any // Force cast if Prisma type generation is delayed in IDE
      });

      // 3. Trigger Compliance Task Auto-generation
      if (user.caId) {
        await TaskService.initializeForClient(profile.id, stakeholderType, user.caId, tx);
      }

      return profile;
    });
  }
}

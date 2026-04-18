import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { ApiError } from '../utils/ApiError';

export class ClientController {
  /**
   * Links a user to a CA using an invitation code. Supports public access 
   * by verifying identity details (email/phone) provided in the body.
   */
  async claimInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, email, phone } = req.body;
      const user = req.user; // sub, email, role should be in here

      if (!code) throw new ApiError(400, 'Invite code is required');
      
      // Pass both session-based user info and body-based identification
      const result = await ClientService.claimInvite({ 
        userId: user?.sub, 
        email: email || (user as any)?.email, 
        phone 
      }, code);
      
      res.status(200).json({ success: true, message: 'Invite claimed successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Completes the user profile and marks them as onboarded.
   */
  async onboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const profile = await ClientService.completeOnboarding(userId, req.body);
      res.status(200).json({ 
        success: true, 
        message: 'Onboarding completed successfully', 
        data: profile 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();

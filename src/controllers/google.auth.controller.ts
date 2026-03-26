import { Request, Response, NextFunction } from 'express';
import { GoogleAuthService } from '../services/google.auth.service';
import { ApiError } from '../utils/ApiError';
import env from '../config/env.config';

export const googleAuthController = {
  getAuthUrl(req: Request, res: Response) {
    const userId = req.user?.sub;
    if (!userId) throw new ApiError(401, 'Unauthorized');
    
    const url = GoogleAuthService.getAuthUrl(userId);
    res.status(200).json({ url });
  },

  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        throw new ApiError(400, 'Invalid callback parameters');
      }

      await GoogleAuthService.handleCallback(code as string, userId as string);

      res.redirect(`${env.ALLOWED_ORIGINS.split(',')[0]}/dashboard?google_connected=true`);
    } catch (error) {
      next(error);
    }
  }
};

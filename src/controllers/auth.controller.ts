import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleAuth(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const decoded = verifyToken(refresh_token, 'refresh');
      if (!decoded) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }
      const result = await authService.refreshToken({ userId: decoded.sub });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) throw new ApiError(400, 'refresh_token is required');
      
      await authService.logout(refresh_token);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.requestPasswordReset(req.body);
      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};

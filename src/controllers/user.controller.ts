import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub; // injected by auth.middleware
      const profile = await userService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const updatedProfile = await userService.updateProfile(userId, req.body);
      res.status(200).json(updatedProfile);
    } catch (error) {
      next(error);
    }
  },

  async setup(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const result = await userService.setup(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateFcmToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.sub;
      const result = await userService.updateFcmToken(userId, req.body.fcm_token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

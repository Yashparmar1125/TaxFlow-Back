import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { ApiError } from '../utils/ApiError';

export const messageController = {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId, role } = req.user!;
      const { taskId } = req.params;
      const { content } = req.body;
      const message = await MessageService.sendMessage(userId, role, req.params.taskId as string, content);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId, role } = req.user!;
      const { taskId } = req.params;
      const messages = await MessageService.getMessages(req.params.taskId as string, userId, role);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  },

  async getThreads(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId, role } = req.user!;
      const threads = await MessageService.getThreads(userId, role);
      res.status(200).json({ success: true, data: threads });
    } catch (error) {
      next(error);
    }
  }
};

import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { ApiError } from '../utils/ApiError';

export const taskController = {
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const task = await TaskService.createTask(caId, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const task = await TaskService.updateTask(caId, req.params.taskId as string, req.body);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const result = await TaskService.deleteTask(caId, req.params.taskId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async generateFYTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const { fy, force } = req.body;
      const result = await TaskService.generateFYTasks(caId, fy, force);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getClientTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new ApiError(401, 'Unauthorized');
      const task = await TaskService.getClientTask(userId, req.params.taskId as string);
      res.status(200).json({ success: true, data: { task, documents: (task as any).documents } });
    } catch (error) {
      next(error);
    }
  },

  async getClientDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      if (!userId) throw new ApiError(401, 'Unauthorized');
      const data = await TaskService.getClientDashboard(userId);
      res.status(200).json({
        success: true,
        data: {
          taskStats: data.stats,
          upcomingDeadlines: data.upcoming,
          unreadFromCA: data.unread
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getCATasks(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const { status, clientId } = req.query;
      const tasks = await TaskService.getCATasks(caId, { 
        status: status as any, 
        clientId: clientId as string 
      });
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }
};

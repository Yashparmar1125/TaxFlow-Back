import { Request, Response, NextFunction } from 'express';
import { CAService } from '../services/ca.service';
import { ApiError } from '../utils/ApiError';

export const caController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const data = await CAService.getDashboard(caId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const clients = await CAService.getClients(caId, req.query);
      res.status(200).json({ clients });
    } catch (error) {
      next(error);
    }
  },

  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const result = await CAService.createClient(caId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const client = await CAService.getClientById(caId as string, req.params.clientId as string);
      res.status(200).json({ client });
    } catch (error) {
      next(error);
    }
  }
};

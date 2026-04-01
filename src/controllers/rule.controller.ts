import { Request, Response, NextFunction } from 'express';
import { RuleService } from '../services/rule.service';
import { ApiError } from '../utils/ApiError';

export const ruleController = {
  async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const rules = await RuleService.getRules(caId);
      res.status(200).json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  },

  async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const rule = await RuleService.createRule(caId, req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  },

  async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const rule = await RuleService.updateRule(caId, req.params.ruleId as string, req.body);
      res.status(200).json({ success: true, data: rule });
    } catch (error) {
      next(error);
    }
  },

  async deleteRule(req: Request, res: Response, next: NextFunction) {
    try {
      const caId = req.user?.sub;
      if (!caId) throw new ApiError(401, 'Unauthorized');
      const result = await RuleService.deleteRule(caId, req.params.ruleId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};

import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { ApiError } from '../utils/ApiError';
import fs from 'fs';

export const documentController = {
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId, title } = req.body;
      const file = req.file;
      const userId = req.user?.sub;

      if (!file) throw new ApiError(400, 'No file uploaded');
      if (!userId) throw new ApiError(401, 'Unauthorized');

      const document = await DocumentService.uploadDocument(userId, req.body.taskId as string, file, req.body.title as string);
      res.status(201).json({ document });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      next(error);
    }
  },

  async updateDocumentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const { status, remarks } = req.body;
      const document = await DocumentService.updateStatus(req.params.docId as string, status, remarks);
      res.status(200).json({ document });
    } catch (error) {
      next(error);
    }
  }
};

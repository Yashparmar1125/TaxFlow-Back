import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { driveService } from './drive.service';
import { TaskStatus } from '@prisma/client';
import fs from 'fs';

export class DocumentService {
  static async uploadDocument(userId: string, taskId: string, file: any, title: string) {
    const task = await prisma.complianceTask.findUnique({
      where: { id: taskId },
      include: { 
        client: { include: { user: true } },
        ca: true
      }
    });

    if (!task) throw new ApiError(404, 'Task not found');
    if (!task.client.user.googleAccessToken) {
      throw new ApiError(400, 'Client has not connected Google Drive');
    }

    try {
      // 1. Upload to Client's Google Drive
      const driveData = await driveService.uploadFileToUserDrive(
        task.client.userId,
        file.path,
        file.originalname,
        file.mimetype,
        task.client.driveFolder
      );

      // 2. Create Document record
      const document = await prisma.document.create({
        data: {
          taskId,
          clientId: task.clientId,
          caId: task.caId,
          fileName: file.originalname,
          documentType: title || 'Other',
          mimeType: file.mimetype,
          sizeBytes: file.size,
          driveFileId: driveData.id!,
          status: 'pending_review'
        }
      });

      // 3. Update task status if needed
      if (task.status === TaskStatus.pending || task.status === TaskStatus.overdue) {
        await prisma.complianceTask.update({
          where: { id: taskId },
          data: { status: TaskStatus.in_review }
        });
      }

      return document;
    } finally {
      // Cleanup local file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }

  static async updateStatus(docId: string, status: any, rejectionReason?: string) {
    return prisma.document.update({
      where: { id: docId },
      data: { status, rejectionReason }
    });
  }
}

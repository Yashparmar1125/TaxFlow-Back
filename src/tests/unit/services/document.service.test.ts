import { DocumentService } from '../../../services/document.service';
import { prismaMock } from '../../setup';
import { createMockDocument } from '../../factories';
import { driveService } from '../../../services/drive.service';
import fs from 'fs';
import { describe, it, expect, vi } from 'vitest';

describe('DocumentService', () => {
  describe('uploadDocument', () => {
    it('should upload a file to drive and create a document record', async () => {
      const userId = 'u1';
      const taskId = 't1';
      const file = { path: 'temp.pdf', originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024 };
      const task = { 
        id: taskId, 
        clientId: 'c1', 
        caId: 'ca1', 
        status: 'pending',
        client: { userId, driveFolder: 'f1', user: { googleAccessToken: 'token' } } 
      };

      prismaMock.complianceTask.findUnique.mockResolvedValue(task as any);
      vi.spyOn(driveService, 'uploadFileToUserDrive').mockResolvedValue({ id: 'drive-id' } as any);
      prismaMock.document.create.mockResolvedValue({ id: 'd1', driveFileId: 'drive-id' } as any);
      prismaMock.complianceTask.update.mockResolvedValue({} as any);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);

      const result = await DocumentService.uploadDocument(userId, taskId, file, 'Title');

      expect(result.driveFileId).toBe('drive-id');
      expect(prismaMock.complianceTask.update).toHaveBeenCalled();
    });
  });

  describe('formatDocument', () => {
    it('should add drive view link to document', () => {
      const doc = createMockDocument({ driveFileId: 'abc-123' });
      const result = DocumentService.formatDocument(doc);
      
      expect(result.viewLink).toBe('https://drive.google.com/file/d/abc-123/view');
    });

    it('should return null if doc is null', () => {
      expect(DocumentService.formatDocument(null)).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update document status and rejection reason', async () => {
      const docId = 'd1';
      const status = 'rejected';
      const rejectionReason = 'Invalid PAN number';
      
      const updatedDoc = createMockDocument({ id: docId, status, rejectionReason });
      prismaMock.document.update.mockResolvedValue(updatedDoc as any);

      const result = await DocumentService.updateStatus(docId, status, rejectionReason);

      expect(prismaMock.document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data: { status, rejectionReason }
      });
      expect(result.status).toBe(status);
      expect(result.rejectionReason).toBe(rejectionReason);
    });
  });

  describe('updateMetadata', () => {
    it('should update file name and document type', async () => {
      const docId = 'd1';
      const data = { fileName: 'new_name.pdf', documentType: 'GST' };
      
      const updatedDoc = createMockDocument({ id: docId, ...data });
      prismaMock.document.update.mockResolvedValue(updatedDoc as any);

      const result = await DocumentService.updateMetadata(docId, data);

      expect(prismaMock.document.update).toHaveBeenCalledWith({
        where: { id: docId },
        data
      });
      expect(result.fileName).toBe(data.fileName);
      expect(result.documentType).toBe(data.documentType);
    });
  });

  describe('getDocument', () => {
    it('should fetch document with task details', async () => {
      const docId = 'd1';
      const doc = createMockDocument({ 
        id: docId,
        task: { title: 'ITR Task', fy: 'FY24' }
      });
      
      (prismaMock as any).document.findUnique.mockResolvedValue(doc);

      const result = await DocumentService.getDocument(docId);

      expect(result.id).toBe(docId);
      expect(result.task.title).toBe('ITR Task');
    });

    it('should throw error if document not found', async () => {
      (prismaMock as any).document.findUnique.mockResolvedValue(null);
      await expect(DocumentService.getDocument('abc')).rejects.toThrow('Document not found');
    });
  });
});

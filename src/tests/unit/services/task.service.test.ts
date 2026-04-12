import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '../../../services/task.service';
import { prismaMock } from '../../setup';
import { TaskType, TaskStatus } from '@prisma/client';
import { createMockTask } from '../../factories';

describe('TaskService', () => {
  describe('initializeForClient', () => {
    it('should create tasks for Salaried Employee', async () => {
      const clientId = 'c1';
      const caId = 'ca1';
      const stakeholderType = 'Salaried Employee';
      
      prismaMock.complianceTask.createMany.mockResolvedValue({ count: 2 } as any);

      await TaskService.initializeForClient(clientId, stakeholderType, caId);

      expect(prismaMock.complianceTask.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ taskType: TaskType.ITR }),
            expect.objectContaining({ taskType: TaskType.ADVANCE_TAX })
          ])
        })
      );
    });

    it('should create generic tasks for unknown stakeholder types', async () => {
      prismaMock.complianceTask.createMany.mockResolvedValue({ count: 1 } as any);
      await TaskService.initializeForClient('c1', 'Unknown', 'ca1');
      
      expect(prismaMock.complianceTask.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ taskType: TaskType.OTHER })
          ])
        })
      );
    });
  });

  describe('getClientDashboard', () => {
    it('should calculate client stats correctly', async () => {
      const userId = 'u1';
      const clientId = 'c1';
      
      prismaMock.clientProfile.findUnique.mockResolvedValue({ id: clientId, userId } as any);
      prismaMock.complianceTask.groupBy.mockResolvedValue([
        { status: TaskStatus.pending, _count: 5 },
        { status: TaskStatus.overdue, _count: 2 }
      ] as any);
      prismaMock.complianceTask.findMany.mockResolvedValue([]);
      prismaMock.messageThread.findFirst.mockResolvedValue({ unreadCountClient: 3 } as any);

      const result = await TaskService.getClientDashboard(userId);

      expect(result.stats[TaskStatus.pending]).toBe(5);
      expect(result.stats[TaskStatus.overdue]).toBe(2);
      expect(result.unread).toBe(3);
    });

    it('should throw error if client profile not found', async () => {
      prismaMock.clientProfile.findUnique.mockResolvedValue(null);
      await expect(TaskService.getClientDashboard('u1')).rejects.toThrow('Client profile not found');
    });
  });

  describe('generateFYTasks', () => {
    it('should generate tasks for all clients of a CA', async () => {
      const caId = 'ca1';
      const fy = 'FY25-26';
      
      prismaMock.clientProfile.findMany.mockResolvedValue([
        { id: 'c1', stakeholderType: 'Business Man' },
        { id: 'c2', stakeholderType: 'Professional' }
      ] as any);

      // Mock findFirst to simulate "no existing tasks"
      prismaMock.complianceTask.findFirst.mockResolvedValue(null);
      prismaMock.complianceTask.createMany.mockResolvedValue({ count: 2 } as any);

      const result = await TaskService.generateFYTasks(caId, fy, false);

      expect(result.message).toContain('Generated tasks for 2 clients');
    });
  });

  describe('getClientTask', () => {
    it('should return a task for a client user', async () => {
      const userId = 'u1';
      const taskId = 't1';
      const task = createMockTask({ id: taskId });
      
      prismaMock.complianceTask.findFirst.mockResolvedValue(task as any);

      const result = await TaskService.getClientTask(userId, taskId);

      expect(result.id).toBe(taskId);
      expect(prismaMock.complianceTask.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: taskId })
        })
      );
    });
  });

  describe('getCATaskById', () => {
    it('should return a task with client and thread details for CA', async () => {
      const caId = 'ca1';
      const taskId = 't1';
      const task = createMockTask({ id: taskId, caId, client: { name: 'Client A' } });
      
      prismaMock.complianceTask.findFirst.mockResolvedValue(task as any);

      const result = await TaskService.getCATaskById(caId, taskId);

      expect(result.id).toBe(taskId);
      expect(result.client.name).toBe('Client A');
    });
  });
});

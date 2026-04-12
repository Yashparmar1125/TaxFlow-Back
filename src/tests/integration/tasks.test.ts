import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../setup';
import { generateToken } from '../../utils/jwt';
import { Role, TaskStatus, TaskType } from '@prisma/client';

describe('Tasks Integration', () => {
  const caId = 'ca-123';
  const caToken = generateToken(caId, 'access', Role.CA);

  describe('GET /api/v1/ca/tasks', () => {
    it('should return tasks for an authenticated CA', async () => {
      const mockTasks = [
        { id: 't1', title: 'Task 1', caId, status: TaskStatus.pending, dueDate: new Date() }
      ];
      prismaMock.complianceTask.findMany.mockResolvedValue(mockTasks as any);

      const response = await request(app)
        .get('/api/v1/ca/tasks')
        .set('Authorization', `Bearer ${caToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Task 1');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get('/api/v1/ca/tasks');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/ca/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        clientId: 'client-1',
        taskType: TaskType.ITR,
        dueDate: new Date().toISOString(),
        fy: 'FY24-25'
      };

      prismaMock.complianceTask.create.mockResolvedValue({ id: 't2', ...taskData, caId } as any);

      const response = await request(app)
        .post('/api/v1/ca/tasks')
        .set('Authorization', `Bearer ${caToken}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('New Task');
    });
  });
});

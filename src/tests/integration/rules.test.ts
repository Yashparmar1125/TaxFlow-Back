import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../setup';
import { generateToken } from '../../utils/jwt';
import { Role, TaskType } from '@prisma/client';

describe('Rules Integration', () => {
  const caId = 'ca-123';
  const caToken = generateToken(caId, 'access', Role.CA);

  describe('GET /api/v1/ca/rules', () => {
    it('should return rules for a CA', async () => {
      prismaMock.complianceRule.findMany.mockResolvedValue([
        { id: 'r1', title: 'Rule A', caId }
      ] as any);

      const response = await request(app)
        .get('/api/v1/ca/rules')
        .set('Authorization', `Bearer ${caToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe('Rule A');
    });
  });

  describe('POST /api/v1/ca/rules', () => {
    it('should create a new compliance rule', async () => {
      const ruleData = {
        title: 'GST Monthly',
        taskType: TaskType.GST_RETURN,
        dueDaysFromFYEnd: 20
      };

      prismaMock.complianceRule.create.mockResolvedValue({ id: 'r2', ...ruleData, caId } as any);

      const response = await request(app)
        .post('/api/v1/ca/rules')
        .set('Authorization', `Bearer ${caToken}`)
        .send(ruleData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('GST Monthly');
    });
  });
});

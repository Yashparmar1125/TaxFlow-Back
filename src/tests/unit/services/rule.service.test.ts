import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RuleService } from '../../../services/rule.service';
import { prismaMock } from '../../setup';
import { TaskType } from '@prisma/client';

describe('RuleService', () => {
  const caId = 'ca1';

  describe('getRules', () => {
    it('should fetch all rules for a CA', async () => {
      const rules = [{ id: 'r1', title: 'Rule 1', caId }];
      prismaMock.complianceRule.findMany.mockResolvedValue(rules as any);

      const result = await RuleService.getRules(caId);

      expect(prismaMock.complianceRule.findMany).toHaveBeenCalledWith({ where: { caId } });
      expect(result).toEqual(rules);
    });
  });

  describe('createRule', () => {
    it('should create a new rule with default isActive true', async () => {
      const ruleData = { title: 'New Rule', taskType: TaskType.ITR, dueDaysFromFYEnd: 30 };
      prismaMock.complianceRule.create.mockResolvedValue({ id: 'r1', ...ruleData, caId, isActive: true } as any);

      const result = await RuleService.createRule(caId, ruleData);

      expect(prismaMock.complianceRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ...ruleData, caId, isActive: true })
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('updateRule', () => {
    it('should update rule if CA owns it', async () => {
      const ruleId = 'r1';
      const updateData = { title: 'Updated' };
      
      prismaMock.complianceRule.findUnique.mockResolvedValue({ id: ruleId, caId } as any);
      prismaMock.complianceRule.update.mockResolvedValue({ id: ruleId, caId, ...updateData } as any);

      const result = await RuleService.updateRule(caId, ruleId, updateData);

      expect(prismaMock.complianceRule.update).toHaveBeenCalledWith({
        where: { id: ruleId },
        data: updateData
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw forbidden error if CA does not own the rule', async () => {
      prismaMock.complianceRule.findUnique.mockResolvedValue({ id: 'r1', caId: 'other-ca' } as any);
      await expect(RuleService.updateRule(caId, 'r1', {})).rejects.toThrow('Forbidden');
    });

    it('should throw not found error if rule does not exist', async () => {
      prismaMock.complianceRule.findUnique.mockResolvedValue(null);
      await expect(RuleService.updateRule(caId, 'r1', {})).rejects.toThrow('Rule not found');
    });
  });

  describe('deleteRule', () => {
    it('should delete rule if CA owns it', async () => {
      const ruleId = 'r1';
      prismaMock.complianceRule.findUnique.mockResolvedValue({ id: ruleId, caId } as any);
      prismaMock.complianceRule.delete.mockResolvedValue({} as any);

      const result = await RuleService.deleteRule(caId, ruleId);

      expect(prismaMock.complianceRule.delete).toHaveBeenCalledWith({ where: { id: ruleId } });
      expect(result.success).toBe(true);
    });
  });
});

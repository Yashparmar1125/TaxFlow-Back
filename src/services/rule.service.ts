import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export class RuleService {
  static async getRules(caId: string) {
    return prisma.complianceRule.findMany({ where: { caId } });
  }

  static async createRule(caId: string, data: any) {
    return prisma.complianceRule.create({
      data: {
        ...data,
        caId,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  static async updateRule(caId: string, ruleId: string, data: any) {
    const rule = await prisma.complianceRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new ApiError(404, 'Rule not found');
    if (rule.caId !== caId) throw new ApiError(403, 'Forbidden');

    return prisma.complianceRule.update({
      where: { id: ruleId },
      data
    });
  }

  static async deleteRule(caId: string, ruleId: string) {
    const rule = await prisma.complianceRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new ApiError(404, 'Rule not found');
    if (rule.caId !== caId) throw new ApiError(403, 'Forbidden');

    await prisma.complianceRule.delete({ where: { id: ruleId } });
    return { success: true };
  }
}

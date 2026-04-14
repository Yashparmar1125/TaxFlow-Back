import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export class RuleService {
  static async getRules(caId: string) {
    return prisma.complianceRule.findMany({ where: { caId } });
  }

  static async createRule(caId: string, data: any) {
    // Map frontend fields to backend schema
    const mappedData: any = {
      caId,
      title: data.taskName || data.title,
      taskType: data.category === 'gst' ? 'GST_RETURN' : 
                data.category === 'itr' ? 'ITR' : 
                data.category === 'audit' ? 'AUDIT' : 'OTHER',
      isActive: data.isActive !== undefined ? data.isActive : true,
      
      // Save full set of frontend fields
      financialYear: data.financialYear,
      officialDueDate: data.officialDueDate ? new Date(data.officialDueDate) : null,
      internalDueDate: data.internalDueDate ? new Date(data.internalDueDate) : null,
      applicableTypes: data.applicableTypes || [],
      reminderDays: data.reminderDays || [30, 7, 1],
      defaultNotes: data.defaultNotes || null,
      defaultPriority: data.defaultPriority || 'normal',
    };

    // Calculate dueDaysFromFYEnd if officialDueDate is provided
    if (data.officialDueDate) {
      const dueDate = new Date(data.officialDueDate);
      const fyEndStr = data.financialYear ? data.financialYear.split('-')[0].replace('FY ', '20') : '2025';
      const fyEndDate = new Date(`${parseInt(fyEndStr) + 1}-03-31`);
      const diffTime = Math.abs(dueDate.getTime() - fyEndDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      mappedData.dueDaysFromFYEnd = diffDays;
    } else {
      mappedData.dueDaysFromFYEnd = data.dueDaysFromFYEnd || 30;
    }

    return prisma.complianceRule.create({
      data: mappedData
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

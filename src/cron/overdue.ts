import cron from 'node-cron';
import prisma from '../config/prisma';
import { TaskStatus } from '@prisma/client';

// Run every day at 12:01 AM
export const initOverdueCron = () => {
  cron.schedule('1 0 * * *', async () => {
    console.log('Running overdue status updater cron...');
    
    const now = new Date();

    const result = await prisma.complianceTask.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: [TaskStatus.pending, TaskStatus.in_review] }
      },
      data: {
        status: TaskStatus.overdue
      }
    });

    console.log(`Updated ${result.count} tasks to overdue status.`);
  });
};

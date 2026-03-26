import cron from 'node-cron';
import prisma from '../config/prisma';
import { firebaseService } from '../services/firebase.service';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Run every day at 9:00 AM
export const initReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running deadline reminders cron...');
    
    const twoDaysFromNow = addDays(new Date(), 2);
    const start = startOfDay(twoDaysFromNow);
    const end = endOfDay(twoDaysFromNow);

    const approachingTasks = await prisma.complianceTask.findMany({
      where: {
        dueDate: { gte: start, lte: end },
        status: 'pending'
      },
      include: {
        client: {
          include: { user: { select: { fcm_token: true } } }
        }
      }
    });

    for (const task of approachingTasks) {
      const token = task.client.user.fcm_token;
      if (token) {
        await firebaseService.sendNotification(
          token,
          'Deadline Reminder',
          `Your task "${task.title}" is due in 2 days.`,
          { taskId: task.id }
        );
      }
    }
  });
};

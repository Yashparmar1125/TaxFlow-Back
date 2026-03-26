import { initReminderCron } from './reminders';
import { initOverdueCron } from './overdue';

export const initCronJobs = () => {
  initReminderCron();
  initOverdueCron();
  console.log('Cron jobs initialized.');
};

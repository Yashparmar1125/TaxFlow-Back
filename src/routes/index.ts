import { Router } from 'express';
import authRoutes from './auth.route';
import googleAuthRoutes from './google.auth.route';
import userRoutes from './user.route';
import caRoutes from './ca.route';
import taskRoutes from './task.route';
import documentRoutes from './document.route';
import messageRoutes from './message.route';
import notificationRoutes from './notification.route';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

router.use('/auth', authRoutes);
router.use('/auth', googleAuthRoutes);
router.use('/users', userRoutes);
router.use('/ca', caRoutes);
router.use('/ca', taskRoutes);
router.use('/client', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);

export default router;

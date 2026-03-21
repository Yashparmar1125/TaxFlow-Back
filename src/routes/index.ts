import { Router } from 'express';
import authRoutes from './auth.route';
import userRoutes from './user.route';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router;

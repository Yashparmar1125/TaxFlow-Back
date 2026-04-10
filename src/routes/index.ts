import { Router } from 'express';
import authRoutes from './auth.route';
import googleAuthRoutes from './google.auth.route';
import userRoutes from './user.route';
import caRoutes from './ca.route';
import caTaskRoutes from './ca.task.route';
import clientTaskRoutes from './client.task.route';
import documentRoutes from './document.route';
import messageRoutes from './message.route';
import notificationRoutes from './notification.route';
import clientRoutes from './client.route';
import { clientController } from '../controllers/client.controller';
import { validateRequest as validate } from '../middlewares/validate.middleware';
import { claimInviteSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth.middleware';

import { systemController } from '../controllers/system.controller';

const router = Router();

router.get('/health', systemController.getHealth);

router.use('/auth', authRoutes);
router.use('/auth', googleAuthRoutes);
router.use('/users', userRoutes);
router.use('/ca', caRoutes);
router.use('/ca', caTaskRoutes);
router.use('/documents', documentRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);

// Client-facing public routes
router.post('/client/claim-invite', validate(claimInviteSchema), clientController.claimInvite);

// Protected client routes
router.use('/client', authenticate);
router.use('/client', clientRoutes); 
router.use('/client', clientTaskRoutes);


export default router;

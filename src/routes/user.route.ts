import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// As per PRD 6.2
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, userController.updateMe);

export default router;

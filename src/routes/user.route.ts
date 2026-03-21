import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateProfileSchema, setupUserSchema, updateFcmTokenSchema } from '../validators/user.validator';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), userController.updateProfile);
router.post('/setup', validateRequest(setupUserSchema), userController.setup);
router.put('/fcm-token', validateRequest(updateFcmTokenSchema), userController.updateFcmToken);

export default router;

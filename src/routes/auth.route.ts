import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { 
  registerSchema, loginSchema, googleAuthSchema, 
  refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema 
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/google', validateRequest(googleAuthSchema), authController.googleAuth);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgotpassword', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/resetpassword', validateRequest(resetPasswordSchema), authController.resetPassword);

export default router;

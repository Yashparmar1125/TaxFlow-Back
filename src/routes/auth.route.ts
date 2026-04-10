import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { verifyFirebaseToken } from '../middlewares/firebase.middleware';
import { 
  loginSchema, 
  registerSchema,
  forgotPasswordSchema, resetPasswordSchema 
} from '../validators/auth.validator';

const router = Router();

// ... (Rest of the swagger and routes)

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

// Firebase Sync (Hybrid Auth)
router.post('/firebase-sync', verifyFirebaseToken, authController.firebaseSync);

// Invitation routes
router.post('/verify-invite', authController.verifyInvite);
router.post('/register-invited', authController.registerByInvite);

export default router;

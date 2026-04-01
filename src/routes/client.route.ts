import { Router } from 'express';
import { clientController } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest as validate } from '../middlewares/validate.middleware';
import { claimInviteSchema, clientOnboardingSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @route POST /api/v1/client/claim-invite
 * @desc Link existing user to a CA via invite code
 */
router.post('/claim-invite', validate(claimInviteSchema), clientController.claimInvite);

/**
 * @route POST /api/v1/client/onboarding
 * @desc Complete user profile and mark as onboarded
 */
router.post('/onboarding', authenticate, validate(clientOnboardingSchema), clientController.onboarding);

export default router;

import { Router } from 'express';
import { googleAuthController } from '../controllers/google.auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /auth/google/url:
 *   get:
 *     summary: Get Google OAuth2 Authorization URL
 *     tags: [Google Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string }
 */
router.get('/google/url', authenticate, googleAuthController.getAuthUrl);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth2 Callback handler
 *     tags: [Google Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema: { type: string }
 *       - name: state
 *         in: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirects back to frontend
 */
router.get('/google/callback', googleAuthController.handleCallback);

export default router;

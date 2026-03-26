import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// As per PRD 6.4
/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     summary: Get all message threads for the user
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', messageController.getThreads);

/**
 * @swagger
 * /api/v1/messages/{taskId}:
 *   post:
 *     summary: Send a message in a task thread
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/:taskId', messageController.sendMessage);

/**
 * @swagger
 * /api/v1/messages/{taskId}:
 *   get:
 *     summary: Get message history for a task
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:taskId', messageController.getMessages);

export default router;

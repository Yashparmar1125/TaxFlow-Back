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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   taskId: { type: string, format: uuid }
 *                   taskTitle: { type: string }
 *                   lastMessage: { $ref: '#/components/schemas/Message' }
 *                   unreadCount: { type: integer }
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
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: 'I have uploaded the requested files.' }
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 */
router.get('/:taskId', messageController.getMessages);

export default router;

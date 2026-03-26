import { Router } from 'express';
import { caController } from '../controllers/ca.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// As per PRD 6.3
router.use(authenticate);
router.use(authorize(Role.CA));

/**
 * @swagger
 * /ca/dashboard:
 *   get:
 *     summary: CA Dashboard Stats
 *     tags: [CA]
 *     responses:
 *       200:
 *         description: Stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalClients: { type: integer }
 *                     pendingTasks: { type: integer }
 *                     inReviewTasks: { type: integer }
 *                     overdueTasks: { type: integer }
 *                     unreadMessages: { type: integer }
 *                 recentDeadlines:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ComplianceTask' }
 */
router.get('/dashboard', caController.getDashboard);

/**
 * @swagger
 * /ca/clients:
 *   get:
 *     summary: List clients
 *     tags: [CA]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ClientProfile' }
 */
router.get('/clients', caController.getClients);

/**
 * @swagger
 * /ca/clients:
 *   post:
 *     summary: Create client
 *     tags: [CA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, pan]
 *             properties:
 *               email: { type: string, format: email, example: 'client@example.com' }
 *               name: { type: string, example: 'ABC Corp' }
 *               pan: { type: string, example: 'ABCDE1234F' }
 *               phone: { type: string, example: '9999999999' }
 *               address: { type: string, example: '123 Street, City' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *                 profile: { $ref: '#/components/schemas/ClientProfile' }
 */
router.post('/clients', caController.createClient);

/**
 * @swagger
 * /ca/clients/{clientId}:
 *   get:
 *     summary: Get client details
 *     tags: [CA]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ClientProfile' }
 */
router.get('/clients/:clientId', caController.getClientById);

export default router;

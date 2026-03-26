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
 */
router.get('/dashboard', caController.getDashboard);

/**
 * @swagger
 * /ca/clients:
 *   get:
 *     summary: List clients
 *     tags: [CA]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/clients', caController.getClients);

/**
 * @swagger
 * /ca/clients:
 *   post:
 *     summary: Create client
 *     tags: [CA]
 *     responses:
 *       201:
 *         description: Created
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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/clients/:clientId', caController.getClientById);

export default router;

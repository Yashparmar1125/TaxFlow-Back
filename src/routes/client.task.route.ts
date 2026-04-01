import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authorize } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// All routes here require CLIENT role
router.use(authorize(Role.CLIENT));

/**
 * @swagger
 * /client/dashboard:
 *   get:
 *     summary: Client Dashboard Stats
 *     tags: [Client Tasks]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', taskController.getClientDashboard);

/**
 * @swagger
 * /client/tasks/{taskId}:
 *   get:
 *     summary: Get specific task for client
 *     tags: [Client Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task with documents
 */
router.get('/tasks/:taskId', taskController.getClientTask);

export default router;

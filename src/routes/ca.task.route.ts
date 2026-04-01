import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { ruleController } from '../controllers/rule.controller';
import { authorize } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// All routes here require CA role
router.use(authorize(Role.CA));

/**
 * @swagger
 * /ca/tasks:
 *   get:
 *     summary: List all tasks for CA
 *     tags: [CA Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_review, approved, overdue] }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/tasks', taskController.getCATasks);

/**
 * @swagger
 * /ca/tasks:
 *   post:
 *     summary: Create manual task (CA)
 *     tags: [CA Tasks]
 */
router.post('/tasks', taskController.createTask);

/**
 * @swagger
 * /ca/tasks/{taskId}:
 *   patch:
 *     summary: Update task details (CA)
 *     tags: [CA Tasks]
 */
router.patch('/tasks/:taskId', taskController.updateTask);

/**
 * @swagger
 * /ca/tasks/{taskId}:
 *   delete:
 *     summary: Delete task (CA)
 *     tags: [CA Tasks]
 */
router.delete('/tasks/:taskId', taskController.deleteTask);

/**
 * @swagger
 * /ca/fy/generate-tasks:
 *   post:
 *     summary: Generate FY Tasks (CA)
 *     tags: [CA Tasks]
 */
router.post('/fy/generate-tasks', taskController.generateFYTasks);

/**
 * @swagger
 * /ca/rules:
 *   get:
 *     summary: List all compliance rules (CA)
 *     tags: [Rules]
 */
router.get('/rules', ruleController.getRules);

/**
 * @swagger
 * /ca/rules:
 *   post:
 *     summary: Create a recurring compliance rule (CA)
 *     tags: [Rules]
 */
router.post('/rules', ruleController.createRule);

export default router;

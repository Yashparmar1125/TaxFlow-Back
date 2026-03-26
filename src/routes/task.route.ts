import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { ruleController } from '../controllers/rule.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// CA Specific Task & Rule Routes
/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create manual task (CA)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, title, dueDate, taskType]
 *             properties:
 *               clientId: { type: string }
 *               title: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               taskType: { type: string, enum: [ITR, GST_RETURN, AUDIT, ADVANCE_TAX, OTHER] }
 *               description: { type: string }
 *               fy: { type: string, example: "2024-25" }
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/tasks', authorize(Role.CA), taskController.createTask);

/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   patch:
 *     summary: Update task details (CA)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, in_review, approved, overdue] }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Task updated
 */
router.patch('/tasks/:taskId', authorize(Role.CA), taskController.updateTask);

/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   delete:
 *     summary: Delete task (CA)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete('/tasks/:taskId', authorize(Role.CA), taskController.deleteTask);

/**
 * @swagger
 * /fy/generate-tasks:
 *   post:
 *     summary: Generate FY Tasks (CA)
 *     tags: [Tasks]
 */
router.post('/fy/generate-tasks', authorize(Role.CA), taskController.generateFYTasks);

/**
 * @swagger
 * /api/v1/rules:
 *   get:
 *     summary: List all compliance rules (CA)
 *     tags: [Rules]
 *     responses:
 *       200:
 *         description: List of rules
 */
router.get('/rules', authorize(Role.CA), ruleController.getRules);

/**
 * @swagger
 * /api/v1/rules:
 *   post:
 *     summary: Create a recurring compliance rule (CA)
 *     tags: [Rules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, taskType, dueDaysFromFYEnd]
 *             properties:
 *               title: { type: string }
 *               taskType: { type: string }
 *               dueDaysFromFYEnd: { type: integer }
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/rules', authorize(Role.CA), ruleController.createRule);

/**
 * @swagger
 * /client/dashboard:
 *   get:
 *     summary: Client Dashboard Stats
 *     tags: [Client Tasks]
 */
router.get('/client/dashboard', authorize(Role.CLIENT), taskController.getClientDashboard);
router.get('/client/tasks/:taskId', authorize(Role.CLIENT), taskController.getClientTask);

export default router;

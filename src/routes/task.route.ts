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
 *               clientId: { type: string, format: uuid }
 *               title: { type: string, example: 'GSTR-3B December' }
 *               dueDate: { type: string, format: date-time, example: '2025-01-20T23:59:59Z' }
 *               taskType: { type: string, enum: [ITR, GST_RETURN, AUDIT, ADVANCE_TAX, OTHER] }
 *               description: { type: string, example: 'Monthly GST return for client' }
 *               fy: { type: string, example: "2024-25" }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ComplianceTask' }
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
 *         schema: { type: string, format: uuid }
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
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ComplianceTask' }
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
 *         schema: { type: string, format: uuid }
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fy]
 *             properties:
 *               fy: { type: string, example: '2025-26' }
 *               force: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Tasks generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasksCreated: { type: integer }
 *                 clientsProcessed: { type: integer }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   title: { type: string }
 *                   taskType: { type: string }
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
 *               title: { type: string, example: 'Monthly GST Filing' }
 *               taskType: { type: string, example: 'GST_RETURN' }
 *               dueDaysFromFYEnd: { type: integer, example: 20 }
 *               documentChecklist: { type: array, items: { type: string } }
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
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     pending: { type: integer }
 *                     inReview: { type: integer }
 *                     approved: { type: integer }
 *                 upcoming:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ComplianceTask' }
 *                 unread: { type: integer }
 */
router.get('/client/dashboard', authorize(Role.CLIENT), taskController.getClientDashboard);

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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ComplianceTask'
 *                 - type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Document' }
 */
router.get('/client/tasks/:taskId', authorize(Role.CLIENT), taskController.getClientTask);

export default router;

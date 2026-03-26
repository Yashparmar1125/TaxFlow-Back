import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Upload document to Drive
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               taskId: { type: string }
 *               title: { type: string }
 */
router.post('/upload', upload.single('file'), documentController.uploadDocument);

/**
 * @swagger
 * /api/v1/documents/{docId}/status:
 *   patch:
 *     summary: Approve or Reject a document (CA)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               remarks: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:docId/status', documentController.updateDocumentStatus);

export default router;

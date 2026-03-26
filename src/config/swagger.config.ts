import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ComplianceOS API Documentation',
      version,
      description: 'API documentation for the ComplianceOS Backend (Production-Ready Refactor)',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['CA', 'CLIENT'] },
            firmId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        ClientProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            pan: { type: 'string', pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
            phone: { type: 'string' },
            driveFolder: { type: 'string' },
          },
        },
        ComplianceTask: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            fy: { type: 'string', example: '2024-25' },
            taskType: { type: 'string', enum: ['ITR', 'GST_RETURN', 'AUDIT', 'ADVANCE_TAX', 'OTHER'] },
            status: { type: 'string', enum: ['pending', 'in_review', 'approved', 'overdue'] },
            dueDate: { type: 'string', format: 'date-time' },
            documentChecklist: { type: 'array', items: { type: 'string' } },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileName: { type: 'string' },
            documentType: { type: 'string' },
            status: { type: 'string', enum: ['pending_review', 'approved', 'rejected'] },
            uploadedAt: { type: 'string', format: 'date-time' },
            driveFileId: { type: 'string' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            senderRole: { type: 'string', enum: ['CA', 'CLIENT'] },
            content: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            body: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            type: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Bad Request' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

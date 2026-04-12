import { Role, TaskType, TaskStatus } from '@prisma/client';

export const createMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test' + Math.random().toString(36).substr(2, 5) + '@example.com',
  full_name: 'Test User',
  role: Role.CLIENT,
  is_active: true,
  is_onboarded: true,
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: 'task-' + Math.random().toString(36).substr(2, 9),
  caId: 'ca-id',
  clientId: 'client-id',
  fy: 'FY24-25',
  title: 'Test Task',
  taskType: TaskType.ITR,
  status: TaskStatus.pending,
  dueDate: new Date(),
  description: 'Description',
  documentChecklist: ['PAN'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockDocument = (overrides = {}) => ({
  id: 'doc-' + Math.random().toString(36).substr(2, 9),
  taskId: 'task-id',
  clientId: 'client-id',
  caId: 'ca-id',
  fileName: 'test.pdf',
  documentType: 'PAN',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  driveFileId: 'drive-id',
  status: 'pending_review',
  uploadedAt: new Date(),
  ...overrides,
});

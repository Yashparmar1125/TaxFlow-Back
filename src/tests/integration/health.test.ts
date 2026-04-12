import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Health Check Integration', () => {
  it('should return 200 OK for base route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Welcome to the API', status: 'OK' });
  });

  it('should return 200 OK for /api/v1/health', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

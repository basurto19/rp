// apps/api/tests/integration/routes.test.ts

import request from 'supertest';
import { createApp } from '../../src/app';

describe('API Routes', () => {
  let app: import('express').Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('Health Check', () => {
    it('GET /health debería retornar éxito', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });
  });

  describe('404 Handler', () => {
    it('Ruta no existente debería retornar 404', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('GET /api/v1/companies sin auth debería retornar 401', async () => {
      const response = await request(app)
        .get('/api/v1/companies')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

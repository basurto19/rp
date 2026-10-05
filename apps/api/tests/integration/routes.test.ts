// apps/api/tests/integration/routes.test.ts

import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';

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

  describe('Proxy configuration', () => {
    it('trusts only the Render proxy hop in production', () => {
      const originalNodeEnv = env.nodeEnv;
      env.nodeEnv = 'production';
      try {
        expect(createApp().get('trust proxy')).toBe(1);
      } finally {
        env.nodeEnv = originalNodeEnv;
      }
    });

    it('does not trust a proxy outside production', () => {
      const originalNodeEnv = env.nodeEnv;
      env.nodeEnv = 'test';
      try {
        expect(createApp().get('trust proxy')).toBe(false);
      } finally {
        env.nodeEnv = originalNodeEnv;
      }
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

  describe('Protected session routes', () => {
    it('POST /api/v1/auth/logout requiere autenticación', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'not-a-real-token' })
        .expect(401);
    });

    describe('Email verification routes', () => {
      it('POST /api/v1/auth/verify-email validates the token body without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify-email')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('POST /api/v1/auth/resend-verification validates the email body without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/auth/resend-verification')
          .send({ email: 'invalid' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });
});

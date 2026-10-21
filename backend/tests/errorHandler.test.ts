import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Express } from 'express';
import { beforeAll, describe, expect, it } from 'vitest';
import { AppError } from '../src/utils/AppError.js';

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/esakhi-test?replicaSet=rs0';
  process.env.CLIENT_ORIGINS = 'http://localhost:5173';
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(128);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(128);
  process.env.OTP_PROVIDER = 'development';
  process.env.DEV_OTP_CODE = '246810';

  const { errorHandler } = await import('../src/middleware/errorHandler.js');
  app = express();
  app.use(express.json({ limit: '32kb' }));
  app.get('/database-error', (_req, _res, next) => {
    next(new mongoose.Error.MongooseServerSelectionError('private connection details'));
  });
  app.get('/network-error', (_req, _res, next) => {
    next(Object.assign(new Error('private connection details'), { name: 'MongoNetworkError' }));
  });
  app.get('/application-error', (_req, _res, next) => {
    next(new AppError(409, 'CONFLICT', 'The record already exists.'));
  });
  app.get('/unexpected-error', (_req, _res, next) => {
    next(new Error('private internal details'));
  });
  app.use(errorHandler);
}, 60_000);

describe('API error handling', () => {
  it.each(['/database-error', '/network-error'])('returns a safe 503 for %s', async (path) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'The database is temporarily unavailable.' },
    });
    expect(JSON.stringify(response.body)).not.toContain('private connection details');
  });

  it('preserves application error status and code', async () => {
    const response = await request(app).get('/application-error');

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('hides unexpected internal error details', async () => {
    const response = await request(app).get('/unexpected-error');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('private internal details');
  });

  it('returns a standard error for malformed JSON', async () => {
    const response = await request(app)
      .post('/application-error')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });
});

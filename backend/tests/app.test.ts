import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { requestOtpSchema } from '../src/modules/auth/auth.schemas.js';
import { productCreateSchema } from '../src/modules/catalog/product.schemas.js';
import { createOrderSchema, orderPaginationQuerySchema } from '../src/modules/orders/order.schemas.js';
import { settingsUpdateSchema } from '../src/modules/settings/settings.schemas.js';

let app: Express;

const protectedRoutes = [
  ['GET', '/api/v1/auth/me'],
  ['PATCH', '/api/v1/auth/me'],
  ['PUT', '/api/v1/auth/me/addresses'],
  ['POST', '/api/v1/orders'],
  ['GET', '/api/v1/orders'],
  ['GET', '/api/v1/orders/64a1b2c3d4e5f6a7b8c9d0e1'],
  ['POST', '/api/v1/orders/64a1b2c3d4e5f6a7b8c9d0e1/cancellation-requests'],
  ['GET', '/api/v1/admin/products'],
  ['POST', '/api/v1/admin/products'],
  ['PATCH', '/api/v1/admin/products/64a1b2c3d4e5f6a7b8c9d0e1'],
  ['DELETE', '/api/v1/admin/products/64a1b2c3d4e5f6a7b8c9d0e1'],
  ['GET', '/api/v1/admin/orders'],
  ['GET', '/api/v1/admin/orders/64a1b2c3d4e5f6a7b8c9d0e1'],
  ['PATCH', '/api/v1/admin/orders/64a1b2c3d4e5f6a7b8c9d0e1/fulfilment'],
  ['POST', '/api/v1/admin/orders/64a1b2c3d4e5f6a7b8c9d0e1/notes'],
  ['POST', '/api/v1/admin/orders/64a1b2c3d4e5f6a7b8c9d0e1/payment-review'],
  ['POST', '/api/v1/admin/orders/64a1b2c3d4e5f6a7b8c9d0e1/cancellation-review'],
  ['GET', '/api/v1/admin/settings'],
  ['PUT', '/api/v1/admin/settings'],
  ['POST', '/api/v1/admin/inventory/64a1b2c3d4e5f6a7b8c9d0e1/adjustments'],
  ['GET', '/api/v1/admin/dashboard'],
  ['GET', '/api/v1/admin/customers'],
  ['GET', '/api/v1/admin/customers/64a1b2c3d4e5f6a7b8c9d0e1'],
  ['GET', '/api/v1/admin/customers/64a1b2c3d4e5f6a7b8c9d0e1/orders'],
  ['PATCH', '/api/v1/admin/users/64a1b2c3d4e5f6a7b8c9d0e1/role'],
  ['PATCH', '/api/v1/admin/users/64a1b2c3d4e5f6a7b8c9d0e1/status'],
] as const;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/esakhi-test?replicaSet=rs0';
  process.env.CLIENT_ORIGINS = 'http://localhost:5173';
  process.env.JWT_ACCESS_SECRET = 'a'.repeat(128);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(128);
  process.env.OTP_PROVIDER = 'development';
  process.env.DEV_OTP_CODE = '246810';
  ({ app } = await import('../src/app.js'));
}, 60_000);

describe('backend API foundation', () => {
  it('provides API information at the server root', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.data.apiBase).toBe('/api/v1');
    expect(response.body.data.health).toBe('/health');
  });

  it('provides API endpoint information at the versioned API root', async () => {
    const response = await request(app).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.body.data.endpoints).toContain('/products');
  });

  it('normalizes Indian phone numbers and rejects malformed numbers', () => {
    expect(requestOtpSchema.parse({ phone: '98765 43210' }).phone).toBe('+919876543210');
    expect(() => requestOtpSchema.parse({ phone: '+911234567890' })).toThrow();
  });

  it('requires an address for delivery checkout', () => {
    const parsed = createOrderSchema.safeParse({
      idempotencyKey: 'request-key-0001',
      customerName: 'Customer',
      customerPhone: '+919876543210',
      fulfilmentMethod: 'delivery',
      items: [{ productId: '64a1b2c3d4e5f6a7b8c9d0e1', quantity: 1 }],
      paymentMethod: 'upi',
    });

    expect(parsed.success).toBe(false);
  });

  it('parses customer-order pagination without using a refined schema pick', () => {
    expect(orderPaginationQuerySchema.parse({ page: '2', limit: '5' })).toEqual({ page: 2, limit: 5 });
    expect(orderPaginationQuerySchema.safeParse({ page: '2', limit: '5', q: 'ignored' }).success).toBe(false);
  });

  it('requires a configured delivery fee before enabling delivery', () => {
    const parsed = settingsUpdateSchema.safeParse({
      businessName: 'eSakhi',
      city: 'Damoh',
      state: 'Madhya Pradesh',
      serviceableLocalities: [{ name: 'Damoh', postalCodes: ['470661'] }],
      pickupEnabled: true,
      deliveryEnabled: true,
      staffEnabled: false,
      upiEnabled: false,
      cashEnabled: false,
      policies: {},
      lowStockThreshold: 5,
      stockReservationHours: null,
    });

    expect(parsed.success).toBe(false);
  });

  it('does not allow base stock to be set when a product has variants', () => {
    const parsed = productCreateSchema.safeParse({
      name: 'Handmade bangles',
      slug: 'handmade-bangles',
      description: 'Test product',
      category: 'Bangles',
      pricePaise: 15000,
      stock: 1,
      variants: [{ attributes: { size: 'Small' }, stock: 2 }],
    });

    expect(parsed.success).toBe(false);
  });

  it('provides a lightweight liveness response without database access', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('serves the fixed product categories', async () => {
    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(['Bangles', 'Jewellery', 'Dupattas', 'Others']);
  });

  it('serves the product category alias', async () => {
    const response = await request(app).get('/api/v1/products/categories');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(['Bangles', 'Jewellery', 'Dupattas', 'Others']);
  });

  it.each(protectedRoutes)('requires authentication for %s %s', async (method, path) => {
    const response = method === 'GET'
      ? await request(app).get(path)
      : method === 'POST'
        ? await request(app).post(path).send({})
        : method === 'PATCH'
          ? await request(app).patch(path).send({})
          : method === 'PUT'
            ? await request(app).put(path).send({})
            : await request(app).delete(path);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns a standard validation response for invalid pagination', async () => {
    const response = await request(app).get('/api/v1/products?page=0');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields.page).toBeDefined();
  });

  it('protects admin APIs server-side', async () => {
    const response = await request(app).get('/api/v1/admin/settings');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns not-ready until the database is connected', async () => {
    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('NOT_READY');
  });
});

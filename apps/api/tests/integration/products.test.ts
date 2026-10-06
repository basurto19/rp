import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { Company } from '../../src/modules/companies/models/company.model';
import { ProductService } from '../../src/modules/products/services/product.service';

describe('tenant product API', () => {
  const app = createApp();
  let listProducts: jest.SpyInstance;
  let createProduct: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Company, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue({ status: 'active' }),
    } as never);
    listProducts = jest.spyOn(ProductService.prototype, 'list').mockResolvedValue([]);
    createProduct = jest
      .spyOn(ProductService.prototype, 'create')
      .mockResolvedValue({ _id: 'new-product', tenantId: 'tenant-a' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function userToken(tenantId = 'tenant-a'): string {
    return jwt.sign(
      { userId: 'user-a', tenantId, roleId: 'user', permissions: [] },
      env.jwtSecret,
    );
  }

  it('allows an authenticated regular user to list only their tenant products', async () => {
    await request(app)
      .get('/api/v1/products?search=cable')
      .set('Authorization', `Bearer ${userToken()}`)
      .expect(200);

    expect(listProducts).toHaveBeenCalledWith('tenant-a', 'cable');
  });

  it('creates products under the token tenant, ignoring client tenant input', async () => {
    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ name: 'Cable USB', sku: 'USB-1', tenantId: 'tenant-b' })
      .expect(201);

    expect(createProduct).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ name: 'Cable USB', sku: 'USB-1' }),
    );
  });

  it('requires authentication for products', async () => {
    await request(app).get('/api/v1/products').expect(401);
  });
});

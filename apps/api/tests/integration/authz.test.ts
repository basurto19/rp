import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { Company } from '../../src/modules/companies/models/company.model';
import { RoleService } from '../../src/modules/roles/services/role.service';
import { MODULES } from '@erp/constants';

describe('role-protected API endpoints', () => {
  const app = createApp();
  let findCompany: jest.SpyInstance;
  let getAllRoles: jest.SpyInstance;

  beforeEach(() => {
    findCompany = jest.spyOn(Company, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue({ status: 'active' }),
    } as never);
    getAllRoles = jest.spyOn(RoleService.prototype, 'getAll').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function token(payload: Record<string, unknown>): string {
    return jwt.sign({ userId: 'test-user', tenantId: 'tenant-1', ...payload }, env.jwtSecret);
  }

  it('returns 403 for USER even when an old JWT carries admin role and permissions', async () => {
    const userToken = token({
      roleId: 'admin',
      permissions: [{ module: MODULES.ROLES, actions: { read: true } }],
    });

    const response = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(getAllRoles).not.toHaveBeenCalled();
  });

  it('allows the persisted primary-admin claim through the endpoint and global service scope', async () => {
    const primaryAdminToken = token({ isPrimaryAdmin: true, roleId: 'super_admin' });

    await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${primaryAdminToken}`)
      .expect(200);

    expect(findCompany).not.toHaveBeenCalled();
    expect(getAllRoles).toHaveBeenCalledWith('tenant-1', true);
  });

  it('does not expose an HTTP bootstrap endpoint', async () => {
    await request(app).post('/api/v1/auth/bootstrap-admin').expect(404);
  });
});

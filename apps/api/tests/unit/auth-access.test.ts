import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../src/middleware/auth';
import { authorizeRole } from '../../src/middleware/tenant';
import { validateTenant } from '../../src/middleware/tenant';
import { env } from '../../src/config/env';
import { AppError } from '../../src/modules/shared/errors/app-error';
import { Company } from '../../src/modules/companies/models/company.model';

function requestWithToken(payload: Record<string, unknown>): Request {
  const token = jwt.sign(payload, env.jwtSecret);
  return { headers: { authorization: `Bearer ${token}` } } as Request;
}

describe('authenticated access claims', () => {
  it('does not honor administrator permissions from legacy access tokens', () => {
    const request = requestWithToken({
      userId: 'legacy-user',
      tenantId: 'tenant-1',
      roleId: 'admin',
      permissions: [{ module: 'users', actions: { read: true } }],
    }) as Request & Record<string, unknown>;
    const next = jest.fn();

    authenticateToken(request, {} as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith();
    expect(request.userRole).toBe('user');
    expect(request.userPermissions).toEqual([]);
    expect(request.isPrimaryAdmin).toBe(false);
  });

  it('preserves only the explicitly signed primary administrator claim', () => {
    const permissions = [{ module: 'users', actions: { read: true } }];
    const request = requestWithToken({
      userId: 'primary-admin',
      tenantId: 'tenant-1',
      isPrimaryAdmin: true,
      permissions,
    }) as Request & Record<string, unknown>;
    const next = jest.fn();

    authenticateToken(request, {} as Response, next as unknown as NextFunction);

    expect(request.userRole).toBe('super_admin');
    expect(request.userPermissions).toEqual(permissions);
    expect(request.isPrimaryAdmin).toBe(true);
  });

  it('rejects purpose-specific password reset tokens as access tokens', () => {
    const request = requestWithToken({
      userId: 'target-user',
      tenantId: 'tenant-1',
      purpose: 'password_reset',
    });
    const next = jest.fn();

    authenticateToken(request, {} as Response, next as unknown as NextFunction);

    expect(next.mock.calls[0][0]).toMatchObject({
      code: 'INVALID_TOKEN',
      statusCode: 401,
    });
  });

  it('allows the primary administrator through permission checks and denies USER', () => {
    const nextForUser = jest.fn((error?: AppError) => error);
    authorizeRole([{ module: 'users', action: 'read' }])(
      { isPrimaryAdmin: false, userPermissions: [] } as unknown as Request,
      {} as Response,
      nextForUser as unknown as NextFunction,
    );
    expect(nextForUser.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect(nextForUser.mock.calls[0][0]?.statusCode).toBe(403);

    const nextForAdmin = jest.fn((error?: AppError) => error);
    authorizeRole([{ module: 'users', action: 'read' }])(
      { isPrimaryAdmin: true, userPermissions: [] } as unknown as Request,
      {} as Response,
      nextForAdmin as unknown as NextFunction,
    );
    expect(nextForAdmin).toHaveBeenCalledWith();
  });

  it('does not tie global primary administrator access to a tenant company record', async () => {
    const findCompany = jest.spyOn(Company, 'findOne');
    const next = jest.fn();

    validateTenant(
      { tenantId: 'inactive-or-removed-tenant', isPrimaryAdmin: true } as unknown as Request,
      {} as Response,
      next as unknown as NextFunction,
    );

    expect(next).toHaveBeenCalledWith();
    expect(findCompany).not.toHaveBeenCalled();
    findCompany.mockRestore();
  });
});

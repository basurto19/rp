// apps/api/src/middleware/tenant.ts
// apps/api/src/middleware/tenant.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../modules/shared/errors/app-error';
import { Company } from '../modules/companies/models/company.model';

interface TenantAwareRequest extends Request {
  tenantId: string;
  branchId?: string | null;
  userId: string;
  userRole: string;
  userPermissions: Array<{ module: string; actions: Record<string, boolean> }>;
  isPrimaryAdmin: boolean;
}

function asyncHandler(
  fn: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
}

export const validateTenant = asyncHandler(
  async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const tenantAwareRequest = request as TenantAwareRequest;

    if (!tenantAwareRequest.tenantId) {
      next(new AppError('UNAUTHORIZED', 'Tenant no identificado', 401));
      return;
    }

    if (typeof tenantAwareRequest.tenantId !== 'string') {
      next(new AppError('INVALID_TOKEN', 'Tenant inválido', 401));
      return;
    }

    if (tenantAwareRequest.isPrimaryAdmin === true) {
      next();
      return;
    }

    try {
      const company = await Company.findOne({ tenantId: tenantAwareRequest.tenantId }).exec();
      if (!company) {
        next(new AppError('UNAUTHORIZED', 'Empresa no encontrada', 401));
        return;
      }
      if (company.status === 'inactive') {
        next(new AppError('FORBIDDEN', 'La empresa está inactiva', 403));
        return;
      }
      next();
    } catch {
      next(new AppError('DATABASE_ERROR', 'Error al validar la empresa', 500));
    }
  },
);

export function authorizeRole(requiredPermissions: Array<{ module: string; action: string }>) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const tenantAwareRequest = request as TenantAwareRequest;
    if (tenantAwareRequest.isPrimaryAdmin === true) {
      next();
      return;
    }

    const userPermissions = tenantAwareRequest.userPermissions || [];

    const hasPermission = requiredPermissions.every((required) => {
      const permission = userPermissions.find(
        (p) => p.module === required.module && p.actions[required.action],
      );
      return permission !== undefined;
    });

    if (!hasPermission) {
      next(new AppError('FORBIDDEN', 'No tienes permisos para esta acción', 403));
      return;
    }

    next();
  };
}

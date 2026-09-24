// apps/api/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../modules/shared/errors/app-error';
import { env } from '../config/env';

interface TenantAwareRequest extends Request {
  tenantId: string;
  branchId?: string | null;
  userId: string;
  userRole: string;
  userPermissions: Array<{ module: string; actions: Record<string, boolean> }>;
}

export function authenticateToken(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Token de acceso no proporcionado'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;

    (request as TenantAwareRequest).userId = decoded.userId;
    (request as TenantAwareRequest).tenantId = decoded.tenantId;
    (request as TenantAwareRequest).branchId = decoded.branchId || null;
    (request as TenantAwareRequest).userRole = decoded.roleId;
    (request as TenantAwareRequest).userPermissions = decoded.permissions || [];

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('TOKEN_EXPIRED', 'Token de acceso expirado'));
    } else {
      next(new AppError('INVALID_TOKEN', 'Token de acceso inválido'));
    }
  }
}

export function authenticateRefreshToken(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    next(new AppError('UNAUTHORIZED', 'Token de refresco no proporcionado'));
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as jwt.JwtPayload;

    (request as TenantAwareRequest).userId = decoded.userId;
    (request as TenantAwareRequest).tenantId = decoded.tenantId;
    (request as TenantAwareRequest).branchId = decoded.branchId || null;
    (request as TenantAwareRequest).userRole = decoded.roleId;

    next();
  } catch (error) {
    next(new AppError('INVALID_TOKEN', 'Token de refresco inválido'));
  }
}

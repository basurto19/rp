// apps/api/src/modules/users/controllers/user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserService } from '../services/user.service';
import { successResponse, errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';
import { validateRequestBody } from '../../shared/validators';
import { createUserSchema, updateUserSchema } from '@erp/validation';
import { env } from '../../../config/env';
import { ROLES } from '@erp/constants';

function serializeUser(user: unknown): Record<string, unknown> {
  if (typeof user !== 'object' || user === null) return {};

  const source = user as Record<string, unknown>;
  const value =
    typeof source.toObject === 'function'
      ? (source.toObject as () => Record<string, unknown>)()
      : source;
  const sensitiveFields = new Set([
    'passwordHash',
    'refreshToken',
    'refreshTokenExpiry',
  ]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveFields.has(key)));
}

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  async getAll(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as any).tenantId;
    const branchId = (request as any).branchId || null;
    const result = await this.service.getAll(
      tenantId,
      branchId,
      {},
      undefined,
      undefined,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, { ...result, data: result.data.map(serializeUser) });
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    const user = await this.service.getById(
      id as string,
      tenantId,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, serializeUser(user));
  }

  async create(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(createUserSchema, body);
    if (!validation.valid) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: validation.errors,
        },
      });
    }

    const tenantId = (request as any).tenantId;
    try {
      const { password, ...userData } = validation.data;
      const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
      const targetTenantId =
        (request as any).isPrimaryAdmin === true && typeof body.tenantId === 'string'
          ? body.tenantId
          : tenantId;
      const user = await this.service.create({
        ...userData,
        roleId: ROLES.USER,
        emailVerified: false,
        emailVerifiedAt: null,
        passwordHash,
        tenantId: targetTenantId,
      });
      return successResponse(response, serializeUser(user), 201, 'Usuario creado');
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const body = request.body;
    const { isPrimaryAdmin: _adminFlag, ...validatedBody } = body;
    const validation = validateRequestBody(updateUserSchema, validatedBody);
    if (!validation.valid) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: validation.errors,
        },
      });
    }

    const tenantId = (request as any).tenantId;
    const updateData: Record<string, unknown> = { ...validation.data };
    if ((request as any).isPrimaryAdmin === true && typeof body.isPrimaryAdmin === 'boolean') {
      updateData.isPrimaryAdmin = body.isPrimaryAdmin;
    }
    const user = await this.service.update(
      id as string,
      tenantId,
      updateData,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, serializeUser(user));
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    await this.service.delete(id as string, tenantId, (request as any).isPrimaryAdmin === true);
    return successResponse(response, { deleted: true }, 200, 'Usuario eliminado');
  }
}

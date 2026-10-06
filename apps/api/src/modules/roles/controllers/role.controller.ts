import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { successResponse, errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';

export class RoleController {
  private service: RoleService;

  constructor() {
    this.service = new RoleService();
  }

  async getAll(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as any).tenantId;
    const result = await this.service.getAll(tenantId, (request as any).isPrimaryAdmin === true);
    return successResponse(response, result);
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    const role = await this.service.getById(
      id as string,
      tenantId,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, role);
  }

  async create(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const tenantId = (request as any).tenantId;
    try {
      const targetTenantId =
        (request as any).isPrimaryAdmin === true && typeof body.tenantId === 'string'
          ? body.tenantId
          : tenantId;
      const role = await this.service.create({ ...body, tenantId: targetTenantId });
      return successResponse(response, role, 201, 'Rol creado');
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const body = request.body;
    const tenantId = (request as any).tenantId;
    const role = await this.service.update(
      id as string,
      tenantId,
      body,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, role);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    await this.service.delete(id as string, tenantId, (request as any).isPrimaryAdmin === true);
    return successResponse(response, { deleted: true }, 200, 'Rol eliminado');
  }
}

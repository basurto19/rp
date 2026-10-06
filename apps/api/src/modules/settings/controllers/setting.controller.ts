import { Request, Response } from 'express';
import { SettingService } from '../services/setting.service';
import { successResponse, errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';

export class SettingController {
  private service: SettingService;

  constructor() {
    this.service = new SettingService();
  }

  async getAll(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as any).tenantId;
    const settings = await this.service.getAll(
      tenantId,
      undefined,
      undefined,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, settings);
  }

  async getByKey(request: Request, response: Response): Promise<Response> {
    const { key } = request.params;
    const tenantId = (request as any).tenantId;
    const setting = await this.service.getByKey(
      key as string,
      typeof request.query.tenantId === 'string' && (request as any).isPrimaryAdmin === true
        ? request.query.tenantId
        : tenantId,
    );
    return successResponse(response, setting);
  }

  async upsert(request: Request, response: Response): Promise<Response> {
    const { key } = request.params;
    const { value, type, description } = request.body;
    const tenantId = (request as any).tenantId;
    try {
      const isPrimaryAdmin = (request as any).isPrimaryAdmin === true;
      const targetTenantId =
        isPrimaryAdmin && typeof request.body.tenantId === 'string'
          ? request.body.tenantId
          : (tenantId as string);
      const setting = await this.service.upsert(
        targetTenantId,
        key as string,
        value,
        type || 'string',
        description || '',
      );
      return successResponse(response, setting, 201, 'Configuración actualizada');
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { key } = request.params;
    const tenantId = (request as any).tenantId;
    const targetTenantId =
      (request as any).isPrimaryAdmin === true && typeof request.query.tenantId === 'string'
        ? request.query.tenantId
        : (tenantId as string);
    await this.service.delete(key as string, targetTenantId);
    return successResponse(response, { deleted: true }, 200, 'Configuración eliminada');
  }
}

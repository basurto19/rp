import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { successResponse } from '../../shared/responses/response-helper';

export class AuditController {
  private service: AuditService;

  constructor() {
    this.service = new AuditService();
  }

  async getAll(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as any).tenantId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;
    const result = await this.service.getByTenant(tenantId, {}, page, limit);
    return successResponse(response, result);
  }

  async getByModule(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as any).tenantId;
    const { module } = request.params as { module: string };
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;
    const result = await this.service.getByModule(tenantId, module, page, limit);
    return successResponse(response, result);
  }
}

import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { successResponse, errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';
import { validateRequestBody } from '../../shared/validators';
import { createCompanySchema, updateCompanySchema } from '@erp/validation';

export class CompanyController {
  private service: CompanyService;

  constructor() {
    this.service = new CompanyService();
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
    return successResponse(response, result);
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    const company = await this.service.getById(
      id as string,
      tenantId,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, company);
  }

  async create(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(createCompanySchema, body);
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
      const targetTenantId =
        (request as any).isPrimaryAdmin === true &&
        typeof (request.body as Record<string, unknown>).tenantId === 'string'
          ? (request.body as Record<string, string>).tenantId
          : tenantId;
      const company = await this.service.create({
        ...validation.data,
        tenantId: targetTenantId,
        status: 'active',
        plan: 'free',
      });
      return successResponse(response, company, 201, 'Empresa creada');
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const body = request.body;
    const validation = validateRequestBody(updateCompanySchema, body);
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
    const company = await this.service.update(
      id as string,
      tenantId,
      validation.data,
      (request as any).isPrimaryAdmin === true,
    );
    return successResponse(response, company);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tenantId = (request as any).tenantId;
    await this.service.delete(id as string, tenantId, (request as any).isPrimaryAdmin === true);
    return successResponse(response, { deleted: true }, 200, 'Empresa eliminada');
  }
}

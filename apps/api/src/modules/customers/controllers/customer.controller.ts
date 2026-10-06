import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createCustomerSchema, updateCustomerSchema } from '@erp/validation';
import { AppError } from '../../shared/errors/app-error';
import { errorResponse, successResponse } from '../../shared/responses/response-helper';
import { CustomerService } from '../services/customer.service';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

export class CustomerController {
  private readonly service = new CustomerService();

  async list(request: Request, response: Response): Promise<Response> {
    const page = parsePositiveInteger(request.query.page, 1);
    const limit = parsePositiveInteger(request.query.limit, 20);
    if (!page || !limit || limit > 100) {
      return validationResponse(response, 'Paginación no válida; limit máximo 100.');
    }

    return successResponse(
      response,
      await this.service.list((request as AuthenticatedRequest).tenantId, {
        search: typeof request.query.search === 'string' ? request.query.search.slice(0, 100) : '',
        page,
        limit,
      }),
    );
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const customerId = String(request.params.id);
    if (!mongoose.isValidObjectId(customerId)) {
      return validationResponse(response, 'El identificador del cliente no es válido.');
    }
    try {
      return successResponse(
        response,
        await this.service.getById((request as AuthenticatedRequest).tenantId, customerId),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async create(request: Request, response: Response): Promise<Response> {
    const validation = createCustomerSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: validation.error.flatten().fieldErrors,
        },
      });
    }
    try {
      return successResponse(
        response,
        await this.service.create((request as AuthenticatedRequest).tenantId, validation.data),
        201,
        'Cliente creado.',
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const customerId = String(request.params.id);
    if (!mongoose.isValidObjectId(customerId)) {
      return validationResponse(response, 'El identificador del cliente no es válido.');
    }
    const validation = updateCustomerSchema.safeParse(request.body);
    if (!validation.success) {
      return response.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: validation.error.flatten().fieldErrors,
        },
      });
    }
    try {
      return successResponse(
        response,
        await this.service.update(
          (request as AuthenticatedRequest).tenantId,
          customerId,
          validation.data,
        ),
        200,
        'Cliente actualizado.',
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async setStatus(request: Request, response: Response): Promise<Response> {
    const customerId = String(request.params.id);
    const status = request.body?.status;
    if (!mongoose.isValidObjectId(customerId)) {
      return validationResponse(response, 'El identificador del cliente no es válido.');
    }
    if (status !== 'active' && status !== 'inactive') {
      return validationResponse(response, 'El estado debe ser active o inactive.');
    }
    try {
      return successResponse(
        response,
        await this.service.setStatus(
          (request as AuthenticatedRequest).tenantId,
          customerId,
          status,
        ),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }
}

function parsePositiveInteger(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function validationResponse(response: Response, message: string): Response {
  return response.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message },
  });
}

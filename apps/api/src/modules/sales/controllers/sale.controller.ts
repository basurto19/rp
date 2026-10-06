import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createSaleSchema } from '@erp/validation';
import { AppError } from '../../shared/errors/app-error';
import { errorResponse, successResponse } from '../../shared/responses/response-helper';
import { SaleService } from '../services/sale.service';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  userId: string;
}

export class SaleController {
  private readonly service = new SaleService();

  async list(request: Request, response: Response): Promise<Response> {
    const page = parsePositiveInteger(request.query.page, 1);
    const limit = parsePositiveInteger(request.query.limit, 20);
    if (!page || !limit || limit > 100) {
      return validationResponse(response, 'Paginación no válida; limit máximo 100.');
    }

    const customerId = typeof request.query.customerId === 'string'
      ? request.query.customerId
      : undefined;
    if (customerId && !mongoose.isValidObjectId(customerId)) {
      return validationResponse(response, 'El identificador del cliente no es válido.');
    }
    const from = parseDate(request.query.from);
    const to = parseDate(request.query.to);
    if ((request.query.from !== undefined && !from) || (request.query.to !== undefined && !to)) {
      return validationResponse(response, 'El rango de fechas no es válido.');
    }
    if (from && to && from > to) {
      return validationResponse(response, 'La fecha inicial debe ser anterior a la final.');
    }

    try {
      return successResponse(
        response,
        await this.service.list((request as AuthenticatedRequest).tenantId, {
          customerId,
          folio: typeof request.query.folio === 'string' ? request.query.folio.slice(0, 80) : undefined,
          status: request.query.status === 'completed' ? 'completed' : undefined,
          from: from ?? undefined,
          to: to ?? undefined,
          page,
          limit,
        }),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async getById(request: Request, response: Response): Promise<Response> {
    try {
      return successResponse(
        response,
        await this.service.getById((request as AuthenticatedRequest).tenantId, String(request.params.id)),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async create(request: Request, response: Response): Promise<Response> {
    const validation = createSaleSchema.safeParse(request.body);
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
    const authenticated = request as AuthenticatedRequest;
    try {
      return successResponse(
        response,
        await this.service.create(
          authenticated.tenantId,
          authenticated.userId,
          validation.data,
        ),
        201,
        'Venta registrada.',
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

function parseDate(value: unknown): Date | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validationResponse(response: Response, message: string): Response {
  return response.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message },
  });
}

import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createProductSchema,
  inventoryMovementSchema,
  updateProductSchema,
} from '@erp/validation';
import { AppError } from '../../shared/errors/app-error';
import { errorResponse, successResponse } from '../../shared/responses/response-helper';
import { ProductService } from '../services/product.service';

interface AuthenticatedRequest extends Request {
  tenantId: string;
  userId: string;
}

export class ProductController {
  private readonly service = new ProductService();

  private validateId(productId: string, response: Response): boolean {
    if (mongoose.isValidObjectId(productId)) return true;
    response.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'El identificador del producto no es válido.' },
    });
    return false;
  }

  async list(request: Request, response: Response): Promise<Response> {
    const tenantId = (request as AuthenticatedRequest).tenantId;
    const search = typeof request.query.search === 'string' ? request.query.search : '';
    return successResponse(response, await this.service.list(tenantId, search));
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const tenantId = (request as AuthenticatedRequest).tenantId;
    return successResponse(response, await this.service.getById(tenantId, productId));
  }

  async create(request: Request, response: Response): Promise<Response> {
    const validation = createProductSchema.safeParse(request.body);
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

    const tenantId = (request as AuthenticatedRequest).tenantId;
    try {
      const product = await this.service.create(tenantId, validation.data);
      return successResponse(response, product, 201, 'Producto creado.');
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const validation = updateProductSchema.safeParse(request.body);
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

    const tenantId = (request as AuthenticatedRequest).tenantId;
    try {
      return successResponse(
        response,
        await this.service.update(tenantId, productId, validation.data),
        200,
        'Producto actualizado.',
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async setStatus(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const status = request.body?.status;
    if (status !== 'active' && status !== 'inactive') {
      return response.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El estado debe ser active o inactive.' },
      });
    }

    const tenantId = (request as AuthenticatedRequest).tenantId;
    try {
      return successResponse(
        response,
        await this.service.setStatus(tenantId, productId, status),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async archive(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const tenantId = (request as AuthenticatedRequest).tenantId;
    try {
      return successResponse(
        response,
        await this.service.setStatus(tenantId, productId, 'inactive'),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async adjustInventory(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const validation = inventoryMovementSchema.safeParse(request.body);
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
        await this.service.adjustInventory(
          authenticated.tenantId,
          productId,
          authenticated.userId,
          validation.data,
        ),
        201,
        'Movimiento de inventario registrado.',
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async listMovements(request: Request, response: Response): Promise<Response> {
    const productId = String(request.params.id);
    if (!this.validateId(productId, response)) return response;
    const tenantId = (request as AuthenticatedRequest).tenantId;
    try {
      return successResponse(
        response,
        await this.service.listMovements(tenantId, productId),
      );
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }
}

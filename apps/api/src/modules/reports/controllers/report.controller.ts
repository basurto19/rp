import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { errorResponse, successResponse } from '../../shared/responses/response-helper';
import { ReportService } from '../services/report.service';

interface AuthenticatedRequest extends Request {
  tenantId: string;
}

export class ReportController {
  private readonly service = new ReportService();

  async customerPurchases(request: Request, response: Response): Promise<Response> {
    const customerId = String(request.params.id ?? '');
    if (!mongoose.isValidObjectId(customerId)) return validation(response, 'Cliente no válido.');
    const page = positiveInt(request.query.page, 1);
    const limit = positiveInt(request.query.limit, 20);
    const from = parseDate(request.query.from);
    const to = parseDate(request.query.to);
    if (!page || !limit || limit > 100 || from === null || to === null || (from && to && from > to)) {
      return validation(response, 'Parámetros de reporte no válidos.');
    }
    try {
      return successResponse(response, await this.service.customerPurchases(
        (request as AuthenticatedRequest).tenantId,
        customerId,
        { page, limit, from: from ?? undefined, to: to ?? undefined },
      ));
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  async customerPurchasesPdf(request: Request, response: Response): Promise<Response> {
    return this.sendPdf(response, () => this.service.customerPurchasesPdf(
      (request as AuthenticatedRequest).tenantId,
      String(request.params.id ?? ''),
    ), 'historial-cliente.pdf');
  }

  async salePdf(request: Request, response: Response): Promise<Response> {
    return this.sendPdf(response, () => this.service.salePdf(
      (request as AuthenticatedRequest).tenantId,
      String(request.params.id ?? ''),
    ), 'venta.pdf');
  }

  async salesPdf(request: Request, response: Response): Promise<Response> {
    const from = parseDate(request.query.from);
    const to = parseDate(request.query.to);
    if (!from || !to) return validation(response, 'from y to son fechas obligatorias.');
    return this.sendPdf(response, () => this.service.salesPdf(
      (request as AuthenticatedRequest).tenantId,
      { from, to },
    ), 'reporte-ventas.pdf');
  }

  async statistics(request: Request, response: Response): Promise<Response> {
    const from = parseDate(request.query.from);
    const to = parseDate(request.query.to);
    if (from === null || to === null || (from && to && from > to)) {
      return validation(response, 'Rango de fechas no válido.');
    }
    try {
      return successResponse(response, await this.service.statistics(
        (request as AuthenticatedRequest).tenantId,
        { from: from ?? undefined, to: to ?? undefined },
      ));
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }

  private async sendPdf(
    response: Response,
    create: () => Promise<Buffer>,
    filename: string,
  ): Promise<Response> {
    try {
      const pdf = await create();
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      response.setHeader('Content-Length', String(pdf.length));
      return response.status(200).send(pdf);
    } catch (error) {
      if (error instanceof AppError) return errorResponse(response, error);
      throw error;
    }
  }
}

function parseDate(value: unknown): Date | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function positiveInt(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function validation(response: Response, message: string): Response {
  return response.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message },
  });
}

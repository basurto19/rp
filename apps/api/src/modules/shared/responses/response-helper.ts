// apps/api/src/modules/shared/responses/response-helper.ts

import { Response } from 'express';
import { AppError } from '../errors/app-error';

export function successResponse<T>(
  response: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
): Response {
  const payload: Record<string, unknown> = { success: true };

  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;

  return response.status(statusCode).json(payload);
}

export function paginatedResponse<T>(
  response: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string,
): Response {
  const hasMore = page * limit < total;

  return successResponse(
    response,
    { data, pagination: { total, page, limit, hasMore } },
    200,
    message,
  );
}

export function errorResponse(
  response: Response,
  error: Error,
  message?: string,
): Response {
  const isAppError = error instanceof AppError;

  const statusCode = isAppError ? (error as AppError).statusCode : 500;
  const code = isAppError ? (error as AppError).code : 'UNKNOWN_ERROR';
  const errorMessage = isAppError ? (error as AppError).message : message || 'Error interno del servidor';
  const details = isAppError ? (error as AppError).details : undefined;

  const responsePayload = {
    success: false,
    error: {
      code,
      message: errorMessage,
      ...(details && { details }),
    },
  };

  return response.status(statusCode).json(responsePayload);
}

export function notFoundResponse(response: Response, resourceType: string): Response {
  return errorResponse(response, new AppError('RESOURCE_NOT_FOUND', `${resourceType} no encontrado`));
}

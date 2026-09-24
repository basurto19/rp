// apps/api/src/middleware/errors.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../modules/shared/errors/app-error';
import { errorResponse } from '../modules/shared/responses/response-helper';

export function errorHandler(
  err: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): Response<Record<string, unknown>> {
  const isAppError = err instanceof AppError;

  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    code: isAppError ? (err as AppError).code : 'UNKNOWN_ERROR',
    path: _request.path,
    method: _request.method,
  });

  return errorResponse(response, err);
}

export function notFoundHandler(
  _request: Request,
  _response: Response,
  next: NextFunction,
): void {
  next(new AppError('RESOURCE_NOT_FOUND', 'Ruta no encontrada', 404));
}

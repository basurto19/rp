// apps/api/src/modules/shared/errors/app-error.ts

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación', details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super('RESOURCE_NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Recurso duplicado') {
    super('DUPLICATE_RESOURCE', message, 409);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Credenciales inválidas') {
    super('INVALID_CREDENTIALS', message, 401);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error de base de datos') {
    super('DATABASE_ERROR', message, 500);
  }
}

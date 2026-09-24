// apps/api/src/modules/shared/index.ts
export { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, AuthenticationError, DatabaseError } from './errors';
export { successResponse, paginatedResponse, errorResponse, notFoundResponse } from './responses';
export { BaseRepository } from './repositories';
export { validateRequestBody, validateRequestQuery, validateRequestParams } from './validators';
export { generateId, generateTenantId, generateBranchId, formatDate, sanitizeString, isUuid, buildPaginationOffset } from './utils';

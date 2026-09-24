// packages/shared-types/src/index.ts

export interface User {
  readonly _id?: string;
  readonly tenantId: string;
  readonly branchId: string | null;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly roleId: string;
  readonly status: UserStatus;
}

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TenantAwareRequest extends Request {
  tenantId: string;
  branchId?: string | null;
  userId: string;
  userRole: string;
  userPermissions: Permission[];
}

export interface Permission {
  module: string;
  actions: Record<string, boolean>;
}

export interface AuditLogEntry {
  tenantId: string;
  branchId: string | null;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  recordType: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string;
  deviceInfo: Record<string, unknown> | null;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery {
  [key: string]: string | unknown;
}

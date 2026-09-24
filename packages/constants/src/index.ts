// packages/constants/src/index.ts

export const APP_CONFIG = {
  API_VERSION: 'v1',
  SERVER_PORT: 3000,
  MAX_FILE_SIZE: 5242880,
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW_MS: 900000,
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  SERVER_SELECTION_TIMEOUT_MS: 5000,
} as const;

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SELLER: 'seller',
  WAREHOUSE: 'warehouse',
  FINANCE: 'finance',
  HR: 'hr',
  VIEWER: 'viewer',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const MODULES = {
  AUTH: 'auth',
  USERS: 'users',
  ROLES: 'roles',
  COMPANIES: 'companies',
  BRANCHES: 'branches',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  SUPPLIERS: 'suppliers',
  INVENTORY: 'inventory',
  SALES: 'sales',
  PURCHASES: 'purchases',
  FINANCE: 'finance',
  REPORTS: 'reports',
  WORKFLOWS: 'workflows',
  NOTIFICATIONS: 'notifications',
  HR: 'hr',
  PROJECTS: 'projects',
  PRODUCTION: 'production',
  SETTINGS: 'settings',
  AUDIT: 'audit',
} as const;

export type ModuleType = (typeof MODULES)[keyof typeof MODULES];

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  APPROVE: 'approve',
} as const;

export type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];

export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_LOCKED: 'USER_LOCKED',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',

  // Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  MISSING_PERMISSION: 'MISSING_PERMISSION',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

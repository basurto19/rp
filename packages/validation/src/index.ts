// packages/validation/src/index.ts

import { z } from 'zod';

// =============================
// Auth Validators
// =============================
export const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().uuid('Token de refresco inválido'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Formato de email inválido'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// =============================
// User Validators
// =============================
export const createUserSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  firstName: z.string().min(1).max(100, 'Nombre demasiado largo'),
  lastName: z.string().min(1).max(100, 'Apellido demasiado largo'),
  roleId: z.string().uuid('ID de rol inválido'),
  branchId: z.string().uuid('ID de sucursal inválido').optional().or(z.literal('')),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  roleId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'locked']).optional(),
});

// =============================
// Company Validators
// =============================
export const createCompanySchema = z.object({
  name: z.string().min(1).max(200, 'Nombre de empresa demasiado largo'),
  ruc: z.string().min(1).max(20, 'RUC inválido'),
  email: z.string().email('Formato de email inválido'),
});

export const updateCompanySchema = createCompanySchema.partial();

// =============================
// Branch Validators
// =============================
export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string(),
  }),
  phone: z.string().min(1).max(20),
});

export const updateBranchSchema = createBranchSchema.partial();

// =============================
// Common Validators
// =============================
export const paginationSchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v ?? '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v ?? '20', 10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const idSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// =============================
// Generic Validator Factory
// =============================
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.flatten().fieldErrors,
    };
  }
  return { valid: true, data: result.data };
}

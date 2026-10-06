// packages/validation/src/index.ts

import { z } from 'zod';

// =============================
// Auth Validators
// =============================
export const loginSchema = z.object({
  email: z.string().trim().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(100),
  email: z.string().trim().email('Formato de email inválido').max(254),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  companyName: z.string().trim().min(1, 'El nombre de la empresa es obligatorio').max(200),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token de verificación requerido').max(256),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Formato de email inválido').max(254),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Token de refresco inválido'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Formato de email inválido'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria').max(128),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(128),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña').max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().trim().max(1000).optional().default(''),
  sku: z.string().trim().min(1, 'El SKU es obligatorio').max(100),
  category: z.string().trim().max(100).optional().default(''),
  costPrice: z.number().finite().min(0).default(0),
  salePrice: z.number().finite().min(0).default(0),
  stock: z.number().finite().min(0).default(0),
  minimumStock: z.number().finite().min(0).default(0),
  unit: z.string().trim().min(1).max(40).default('unidad'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateProductSchema = createProductSchema.omit({ stock: true }).partial();

export const inventoryMovementSchema = z.object({
  type: z.enum(['entry', 'exit']),
  quantity: z.number().finite().positive().max(1_000_000_000),
  notes: z.string().trim().max(500).optional().default(''),
});

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional().default(''),
  email: z.string().trim().email().max(254).optional().or(z.literal('')).default(''),
  phone: z.string().trim().max(40).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  state: z.string().trim().max(100).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
  rfc: z.string().trim().max(20).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createSaleSchema = z.object({
  customerId: z.string().regex(/^[a-f\d]{24}$/i, 'Cliente inválido'),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-f\d]{24}$/i, 'Producto inválido'),
    quantity: z.number().finite().positive().max(1_000_000),
  })).min(1).max(50),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  notes: z.string().trim().max(1000).optional().default(''),
});

// =============================
// User Validators
// =============================
export const createUserSchema = z.object({
  email: z.string().trim().email('Formato de email inválido').max(254),
  firstName: z.string().trim().min(1).max(100, 'Nombre demasiado largo'),
  lastName: z.string().trim().min(1).max(100, 'Apellido demasiado largo'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
  roleId: z.string().trim().min(1).max(100).optional(),
  tenantId: z.string().trim().min(1).optional(),
  branchId: z.string().uuid('ID de sucursal inválido').optional().or(z.literal('')),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  roleId: z.string().trim().min(1).max(100).optional(),
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
  tenantId: z.string().trim().min(1).optional(),
});

export const updateCompanySchema = createCompanySchema.omit({ tenantId: true }).partial();

// =============================
// Branch Validators
// =============================
export const createBranchSchema = z.object({
  branchId: z.string().uuid('ID de sucursal inválido'),
  tenantId: z.string().trim().min(1).optional(),
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

export const updateBranchSchema = createBranchSchema.omit({ tenantId: true }).partial();

// =============================
// Common Validators
// =============================
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? '1', 10)),
  limit: z
    .string()
    .optional()
    .transform((v) => parseInt(v ?? '20', 10)),
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

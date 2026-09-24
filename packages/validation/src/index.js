"use strict";
// packages/validation/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.idSchema = exports.paginationSchema = exports.updateBranchSchema = exports.createBranchSchema = exports.updateCompanySchema = exports.createCompanySchema = exports.updateUserSchema = exports.createUserSchema = exports.changePasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = void 0;
exports.validateSchema = validateSchema;
const zod_1 = require("zod");
// =============================
// Auth Validators
// =============================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Formato de email inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es obligatoria'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().uuid('Token de refresco inválido'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Formato de email inválido'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: zod_1.z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: zod_1.z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});
// =============================
// User Validators
// =============================
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Formato de email inválido'),
    firstName: zod_1.z.string().min(1).max(100, 'Nombre demasiado largo'),
    lastName: zod_1.z.string().min(1).max(100, 'Apellido demasiado largo'),
    roleId: zod_1.z.string().uuid('ID de rol inválido'),
    branchId: zod_1.z.string().uuid('ID de sucursal inválido').optional().or(zod_1.z.literal('')),
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    roleId: zod_1.z.string().uuid().optional(),
    branchId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
    status: zod_1.z.enum(['active', 'inactive', 'locked']).optional(),
});
// =============================
// Company Validators
// =============================
exports.createCompanySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200, 'Nombre de empresa demasiado largo'),
    ruc: zod_1.z.string().min(1).max(20, 'RUC inválido'),
    email: zod_1.z.string().email('Formato de email inválido'),
});
exports.updateCompanySchema = exports.createCompanySchema.partial();
// =============================
// Branch Validators
// =============================
exports.createBranchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    address: zod_1.z.object({
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        country: zod_1.z.string(),
        zipCode: zod_1.z.string(),
    }),
    phone: zod_1.z.string().min(1).max(20),
});
exports.updateBranchSchema = exports.createBranchSchema.partial();
// =============================
// Common Validators
// =============================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform((v) => parseInt(v ?? '1', 10)),
    limit: zod_1.z.string().optional().transform((v) => parseInt(v ?? '20', 10)),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.idSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('ID inválido'),
});
// =============================
// Generic Validator Factory
// =============================
function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        return {
            valid: false,
            errors: result.error.flatten().fieldErrors,
        };
    }
    return { valid: true, data: result.data };
}
//# sourceMappingURL=index.js.map
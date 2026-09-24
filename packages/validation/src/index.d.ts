import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roleId: z.ZodString;
    branchId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodOptional<z.ZodEnum<{
        locked: "locked";
        active: "active";
        inactive: "inactive";
    }>>;
}, z.core.$strip>;
export declare const createCompanySchema: z.ZodObject<{
    name: z.ZodString;
    ruc: z.ZodString;
    email: z.ZodString;
}, z.core.$strip>;
export declare const updateCompanySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    ruc: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createBranchSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        country: z.ZodString;
        zipCode: z.ZodString;
    }, z.core.$strip>;
    phone: z.ZodString;
}, z.core.$strip>;
export declare const updateBranchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        country: z.ZodString;
        zipCode: z.ZodString;
    }, z.core.$strip>>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const idSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
    valid: boolean;
    errors: { [P in keyof T]?: string[] | undefined; };
    data?: undefined;
} | {
    valid: boolean;
    data: T;
    errors?: undefined;
};
//# sourceMappingURL=index.d.ts.map
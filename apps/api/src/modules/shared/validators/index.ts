// apps/api/src/modules/shared/validators/index.ts

import { z } from 'zod';

export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): { valid: boolean; data: T; errors?: Record<string, string[]> } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { valid: false, data: {} as T, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { valid: true, data: result.data as T };
}

export function validateRequestQuery<T>(schema: z.ZodSchema<T>, query: unknown): { valid: boolean; data: T; errors?: Record<string, string[]> } {
  const result = schema.safeParse(query);
  if (!result.success) {
    return { valid: false, data: {} as T, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { valid: true, data: result.data as T };
}

export function validateRequestParams<T>(schema: z.ZodSchema<T>, params: unknown): { valid: boolean; data: T; errors?: Record<string, string[]> } {
  const result = schema.safeParse(params);
  if (!result.success) {
    return { valid: false, data: {} as T, errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }
  return { valid: true, data: result.data as T };
}

// apps/api/src/modules/shared/utils/index.ts
// Utilidades compartidas para todo el sistema ERP
// Definidas aquí para que el módulo compartido sea autosuficiente

import { randomUUID } from 'node:crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateTenantId(): string {
  return `tenant_${randomUUID().slice(0, 8)}`;
}

export function generateBranchId(): string {
  return `branch_${randomUUID().slice(0, 8)}`;
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function getCurrentUTCDate(): Date {
  return new Date();
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>;"'&]/g, '').trim();
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function buildPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

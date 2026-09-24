// packages/utils/src/index.ts
// Utilidades compartidas para todo el sistema ERP

declare const crypto: {
  randomUUID(): string;
};

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateTenantId(): string {
  return `tenant_${crypto.randomUUID().slice(0, 8)}`;
}

export function generateBranchId(): string {
  return `branch_${crypto.randomUUID().slice(0, 8)}`;
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

// apps/api/src/middleware/audit.ts

import { Request, Response, NextFunction } from 'express';
import { AuditLogEntry } from '@erp/shared-types';
import { generateId } from '@erp/utils';

function asyncHandler(
  fn: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
}

const auditQueue: AuditLogEntry[] = [];
const AUDIT_BATCH_SIZE = 10;
const AUDIT_FLUSH_INTERVAL_MS = 5000;

function flushAuditQueue(): void {
  if (auditQueue.length === 0) return;
  const batch = auditQueue.splice(0, AUDIT_BATCH_SIZE);
  console.info(`[AUDIT] Flushing ${batch.length} audit entries`, batch);
}

setInterval(flushAuditQueue, AUDIT_FLUSH_INTERVAL_MS).unref();

export function auditMiddleware(action: string, module: string) {
  return asyncHandler(
    async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
      const startTime = Date.now();

      _response.on('finish', () => {
        const auditEntry: AuditLogEntry = {
          tenantId: (request as any).tenantId,
          branchId: (request as any).branchId || null,
          userId: (request as any).userId || 'system',
          userName: '',
          action,
          module,
          recordId: generateId(),
          recordType: module,
          previousData: null,
          newData: {
            method: request.method,
            path: request.path,
            body: JSON.stringify(sanitizeBody(request.body)),
            statusCode: _response.statusCode,
            duration: Date.now() - startTime,
          },
          ip: request.ip || request.socket?.remoteAddress || 'unknown',
          deviceInfo: {
            userAgent: request.get('user-agent'),
          },
        };

        auditQueue.push(auditEntry);

        if (auditQueue.length >= AUDIT_BATCH_SIZE) {
          flushAuditQueue();
        }
      });

      next();
    },
  );
}

export function sanitizeBody(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(sanitizeBody);
  if (!body || typeof body !== 'object') return body;

  return Object.fromEntries(
    Object.entries(body)
      .filter(
        ([key]) =>
          !/(?:password|token|secret|credential|(?:api|private)[_-]?key|authorization|(?:admin|confirmation|verification|one.?time|otp).?code|^code$)/i.test(
            key,
          ),
      )
      .map(([key, value]) => [key, sanitizeBody(value)]),
  );
}

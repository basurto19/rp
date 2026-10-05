// apps/api/src/modules/audit/services/audit.service.ts

import { AuditLog } from '../models/audit-log.model';
import { generateId } from '../../shared/utils';

export class AuditService {
  async log(entry: any) {
    const logEntry = new AuditLog({
      ...entry,
      recordId: entry.recordId || generateId(),
      timestamp: new Date(),
    });
    return logEntry.save();
  }

  async getByTenant(tenantId: string, filter: Record<string, unknown> = {}, page: number = 1, limit: number = 20) {
    const combinedFilter = { tenantId, ...filter };
    const [total, data] = await Promise.all([
      AuditLog.countDocuments(combinedFilter).exec(),
      AuditLog.find(combinedFilter as Record<string, unknown>)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);
    return { data, total, page, limit, hasMore: page * limit < total };
  }

  async getByModule(tenantId: string, module: string, page?: number, limit?: number) {
    const result = await this.getByTenant(tenantId, { module }, page || 1, limit || 20);
    return result;
  }
}

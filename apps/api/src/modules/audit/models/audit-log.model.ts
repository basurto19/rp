// apps/api/src/modules/audit/models/audit-log.model.ts

import { Schema, model } from 'mongoose';

export interface IAuditLog {
  tenantId: string;
  branchId: string | null;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  recordType: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string;
  deviceInfo: Record<string, unknown> | null;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String },
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  recordId: { type: String, index: true },
  recordType: { type: String },
  previousData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed },
  ip: { type: String },
  deviceInfo: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, module: 1, action: 1 });
auditLogSchema.index({ tenantId: 1, userId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

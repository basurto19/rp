// apps/api/src/modules/roles/models/role.model.ts

import { Schema, model } from 'mongoose';

export interface IPermission {
  module: string;
  actions: Record<string, boolean>;
}

export interface IRole {
  tenantId: string;
  roleId: string;
  name: string;
  description: string;
  permissions: IPermission[];
  scope: 'company' | 'branch';
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>({
  tenantId: { type: String, required: true, index: true },
  roleId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  permissions: [{ module: String, actions: Schema.Types.Mixed }],
  scope: { type: String, enum: ['company', 'branch'], default: 'company' },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

roleSchema.index({ tenantId: 1, roleId: 1 });

export const Role = model<IRole>('Role', roleSchema);

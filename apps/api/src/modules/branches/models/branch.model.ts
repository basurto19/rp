// apps/api/src/modules/branches/models/branch.model.ts
import { Schema, model } from 'mongoose';

export interface IBranch {
  tenantId: string;
  branchId: string;
  name: string;
  address: { street: string; city: string; state: string; country: string; zipCode: string };
  phone: string;
  status: string;
}

const branchSchema = new Schema<IBranch>({
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  address: { type: Schema.Types.Mixed, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

branchSchema.index({ tenantId: 1, branchId: 1 });

export const Branch = model<IBranch>('Branch', branchSchema);

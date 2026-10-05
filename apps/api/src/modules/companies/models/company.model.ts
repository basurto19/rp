// apps/api/src/modules/companies/models/company.model.ts
import { Schema, model } from 'mongoose';

export interface ICompany {
  tenantId: string;
  name: string;
  ruc?: string;
  email: string;
  logo?: string;
  settings?: Record<string, unknown>;
  status: string;
  plan: string;
}

const companySchema = new Schema<ICompany>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  ruc: { type: String, required: false, maxlength: 20 },
  email: { type: String, required: true },
  logo: { type: String },
  settings: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
}, { timestamps: true });

companySchema.index({ tenantId: 1, status: 1 });

export const Company = model<ICompany>('Company', companySchema);

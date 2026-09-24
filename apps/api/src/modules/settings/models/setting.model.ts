import { Schema, model, Document } from 'mongoose';

export interface ISetting extends Document {
  tenantId: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
}

const settingSchema = new Schema<ISetting>({
  tenantId: { type: String, required: true, index: true },
  key: { type: String, required: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'json'], default: 'string' },
  description: { type: String },
}, { timestamps: true });

settingSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Setting = model<ISetting>('Setting', settingSchema);

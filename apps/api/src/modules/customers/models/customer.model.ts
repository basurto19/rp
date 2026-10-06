import { Schema, model } from 'mongoose';

export interface ICustomer {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  rfc: string;
  notes: string;
  status: 'active' | 'inactive';
  isDemo?: boolean;
  demoSeedVersion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    tenantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, default: '', trim: true, maxlength: 100 },
    email: { type: String, default: '', trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    address: { type: String, default: '', trim: true, maxlength: 300 },
    city: { type: String, default: '', trim: true, maxlength: 100 },
    state: { type: String, default: '', trim: true, maxlength: 100 },
    postalCode: { type: String, default: '', trim: true, maxlength: 20 },
    rfc: { type: String, default: '', trim: true, uppercase: true, maxlength: 20 },
    notes: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isDemo: { type: Boolean, default: false },
    demoSeedVersion: { type: String, default: undefined },
  },
  { timestamps: true },
);

customerSchema.index({ tenantId: 1, firstName: 1, lastName: 1 });
customerSchema.index({ tenantId: 1, email: 1 });
customerSchema.index(
  { tenantId: 1, demoSeedVersion: 1, email: 1 },
  { unique: true, partialFilterExpression: { demoSeedVersion: { $type: 'string' } } },
);

export const Customer = model<ICustomer>('Customer', customerSchema);

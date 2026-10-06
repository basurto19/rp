import { Schema, model } from 'mongoose';

export interface IProduct {
  tenantId: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  unit: string;
  status: 'active' | 'inactive';
  isDemo?: boolean;
  demoSeedVersion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 100 },
    category: { type: String, default: '', trim: true, maxlength: 100 },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minimumStock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true, default: 'unidad', maxlength: 40 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isDemo: { type: Boolean, default: false },
    demoSeedVersion: { type: String, default: undefined },
  },
  { timestamps: true },
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, name: 1 });
productSchema.index(
  { tenantId: 1, demoSeedVersion: 1, sku: 1 },
  { unique: true, partialFilterExpression: { demoSeedVersion: { $type: 'string' } } },
);

export const Product = model<IProduct>('Product', productSchema);

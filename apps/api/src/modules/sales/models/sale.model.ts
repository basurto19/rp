import { Schema, model, Types } from 'mongoose';

export interface ISaleItem {
  productId: Types.ObjectId;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale {
  tenantId: string;
  folio: string;
  customerId: Types.ObjectId;
  customerName: string;
  userId: string;
  saleDate: Date;
  status: 'completed';
  items: ISaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  notes: string;
  isDemo?: boolean;
  demoSeedVersion?: string;
  demoSaleIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const saleSchema = new Schema<ISale>(
  {
    tenantId: { type: String, required: true, index: true },
    folio: { type: String, required: true, trim: true, maxlength: 80 },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Customer', index: true },
    customerName: { type: String, required: true, maxlength: 201 },
    userId: { type: String, required: true },
    saleDate: { type: Date, required: true, default: Date.now, index: true },
    status: { type: String, enum: ['completed'], default: 'completed', required: true },
    items: {
      type: [{
        productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
        sku: { type: String, required: true, maxlength: 100 },
        productName: { type: String, required: true, maxlength: 200 },
        quantity: { type: Number, required: true, min: 0.000001 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      }],
      required: true,
      validate: [(items: unknown[]) => items.length > 0, 'La venta requiere partidas'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'other'],
      required: true,
    },
    notes: { type: String, default: '', maxlength: 1000 },
    isDemo: { type: Boolean, default: false },
    demoSeedVersion: { type: String, default: undefined },
    demoSaleIndex: { type: Number, default: undefined },
  },
  { timestamps: true },
);

saleSchema.index({ tenantId: 1, folio: 1 }, { unique: true });
saleSchema.index({ tenantId: 1, customerId: 1, saleDate: -1 });
saleSchema.index({ tenantId: 1, saleDate: -1 });
saleSchema.index(
  { tenantId: 1, demoSeedVersion: 1, demoSaleIndex: 1 },
  {
    unique: true,
    partialFilterExpression: { demoSeedVersion: { $type: 'string' } },
  },
);

export const Sale = model<ISale>('Sale', saleSchema);

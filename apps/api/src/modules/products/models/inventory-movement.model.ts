import { Schema, model } from 'mongoose';

export interface IInventoryMovement {
  tenantId: string;
  productId: Schema.Types.ObjectId;
  userId: string;
  type: 'entry' | 'exit';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  notes: string;
  createdAt?: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    tenantId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product', index: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ['entry', 'exit'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true },
);

inventoryMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });

export const InventoryMovement = model<IInventoryMovement>(
  'InventoryMovement',
  inventoryMovementSchema,
);

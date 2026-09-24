// apps/api/src/modules/users/models/user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser {
  tenantId: string;
  branchId: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: string;
  status: string;
  refreshToken: string | null;
  refreshTokenExpiry: Date | null;
  lastLoginAt: Date | null;
}

const userSchema = new Schema<IUser>({
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  email: { type: String, required: true, index: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, maxlength: 100 },
  lastName: { type: String, required: true, maxlength: 100 },
  roleId: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'locked'], default: 'active' },
  refreshToken: { type: String },
  refreshTokenExpiry: { type: Date },
  lastLoginAt: { type: Date },
}, { timestamps: true });

userSchema.index({ tenantId: 1, email: 1 });
userSchema.index({ branchId: 1 });
userSchema.index({ roleId: 1 });

export const User = model<IUser>('User', userSchema);

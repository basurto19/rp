// apps/api/src/modules/users/models/user.model.ts
import { Schema, model } from 'mongoose';

export interface IUser {
  tenantId: string;
  branchId: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isPrimaryAdmin?: boolean;
  status: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  welcomeEmailSentAt?: Date | null;
  welcomeEmailSendingAt?: Date | null;
  createdAt?: Date;
  refreshToken: string | null;
  refreshTokenExpiry: Date | null;
  lastLoginAt: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    email: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, maxlength: 100 },
    lastName: { type: String, required: true, maxlength: 100 },
    roleId: { type: String, required: true },
    isPrimaryAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'locked'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    welcomeEmailSentAt: { type: Date, default: null },
    welcomeEmailSendingAt: { type: Date, default: null },
    refreshToken: { type: String },
    refreshTokenExpiry: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1, email: 1 });
userSchema.index({ branchId: 1 });
userSchema.index({ roleId: 1 });
userSchema.index(
  { isPrimaryAdmin: 1 },
  { unique: true, partialFilterExpression: { isPrimaryAdmin: true } },
);

export const User = model<IUser>('User', userSchema);

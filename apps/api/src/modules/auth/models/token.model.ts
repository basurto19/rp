// apps/api/src/modules/auth/models/token.model.ts

import { Schema, model } from 'mongoose';

export interface IToken {
  userId: string;
  tenantId: string;
  refreshToken: string;
  expiresAt: Date;
  revoked: boolean;
}

const tokenSchema = new Schema<IToken>({
  userId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  refreshToken: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

tokenSchema.index({ userId: 1, tenantId: 1 });
tokenSchema.index({ expiresAt: 1 });

export const Token = model<IToken>('Token', tokenSchema);

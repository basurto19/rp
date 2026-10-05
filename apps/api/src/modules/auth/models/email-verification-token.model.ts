import { Schema, model } from 'mongoose';

export interface IEmailVerificationToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

export const EmailVerificationToken = model<IEmailVerificationToken>(
  'EmailVerificationToken',
  emailVerificationTokenSchema,
);

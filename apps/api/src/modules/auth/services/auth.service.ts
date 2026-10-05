import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '../../users/models/user.model';
import { Company } from '../../companies/models/company.model';
import { Role } from '../../roles/models/role.model';
import { Token } from '../models/token.model';
import { EmailVerificationToken } from '../models/email-verification-token.model';
import { sendVerificationEmail } from './email.service';
import { AppError } from '../../shared/errors/app-error';
import { env } from '../../../config/env';
import { generateTenantId } from '../../shared/utils';
import { ROLES } from '@erp/constants';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_VERIFICATION_MESSAGE = 'Si la cuenta existe y aún no está verificada, enviaremos un correo de verificación.';

function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const adminPermissions = [
  { module: 'users', actions: { read: true, create: true, update: true, delete: true } },
  { module: 'companies', actions: { read: true, create: true, update: true, delete: true } },
  { module: 'branches', actions: { read: true, create: true, update: true, delete: true } },
  { module: 'roles', actions: { read: true, create: true, update: true, delete: true } },
  { module: 'settings', actions: { read: true, update: true, delete: true } },
  { module: 'audit', actions: { read: true } },
];

export class AuthService {
  async register(input: RegisterInput): Promise<{ message: string }> {
    const email = input.email.toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const tenantId = generateTenantId();
    const roleId = ROLES.ADMIN;
    const mongoSession = await mongoose.startSession();
    let registeredUser: { id: string; email: string; firstName: string } | undefined;

    try {
      await mongoSession.withTransaction(async () => {
        const existingUser = await User.findOne({ email }).session(mongoSession).exec();
        if (existingUser) {
          throw new AppError('DUPLICATE_RESOURCE', 'Ya existe una cuenta con ese correo', 409);
        }

        const company = new Company({
          tenantId,
          name: input.companyName,
          email,
          status: 'active',
          plan: 'free',
        });
        await company.save({ session: mongoSession });

        const role = new Role({
          tenantId,
          roleId,
          name: 'Administrador',
          description: 'Administrador inicial de la empresa',
          permissions: adminPermissions,
          scope: 'company',
          isSystem: true,
        });
        await role.save({ session: mongoSession });

        const user = new User({
          tenantId,
          branchId: null,
          email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          roleId,
          status: 'active',
          emailVerified: false,
          emailVerifiedAt: null,
        });
        await user.save({ session: mongoSession });

        registeredUser = {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
        };
      });
    } finally {
      await mongoSession.endSession();
    }

    if (!registeredUser) throw new AppError('DATABASE_ERROR', 'No se pudo crear la cuenta');

    const token = await this.replaceEmailVerificationToken(registeredUser.id);
    try {
      await sendVerificationEmail({ ...registeredUser, token });
    } catch {
      console.error('Verification email delivery failed during registration');
      throw new AppError(
        'EMAIL_DELIVERY_FAILED',
        'La cuenta fue creada, pero no se pudo enviar el correo. Solicita un nuevo enlace de verificación.',
        503,
      );
    }

    return { message: 'Cuenta creada. Revisa tu correo para verificarla.' };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
    if (user.status === 'locked') throw new AppError('USER_LOCKED', 'Usuario bloqueado', 403);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
    if (user.emailVerified === false) {
      throw new AppError('EMAIL_NOT_VERIFIED', 'Verifica tu correo antes de iniciar sesión.', 403);
    }

    const permissions = await this.getPermissions(user);
    const accessToken = this.generateAccessToken(user, permissions);
    const refreshToken = this.generateRefreshToken(user);

    await Token.create({
      userId: user._id.toString(),
      tenantId: user.tenantId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user, permissions),
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const now = new Date();
    const verification = await EmailVerificationToken.findOneAndDelete({
      tokenHash: hashVerificationToken(token),
      expiresAt: { $gt: now },
    }).exec();

    if (!verification) {
      throw new AppError('INVALID_VERIFICATION_TOKEN', 'El enlace de verificación no es válido o ha expirado.', 400);
    }

    const user = await User.findByIdAndUpdate(
      verification.userId,
      { emailVerified: true, emailVerifiedAt: now },
      { new: true },
    ).exec();
    if (!user) {
      throw new AppError('INVALID_VERIFICATION_TOKEN', 'El enlace de verificación no es válido o ha expirado.', 400);
    }

    return { message: 'Correo verificado correctamente.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email: email.toLowerCase(), emailVerified: false }).exec();
    if (!user) return { message: RESEND_VERIFICATION_MESSAGE };

    const token = await this.replaceEmailVerificationToken(user._id.toString());
    try {
      await sendVerificationEmail({ email: user.email, firstName: user.firstName, token });
    } catch {
      console.error('Verification email delivery failed during resend');
    }

    return { message: RESEND_VERIFICATION_MESSAGE };
  }

  async refreshToken(refreshTokenStr: string) {
    const decoded = jwt.verify(refreshTokenStr, env.jwtRefreshSecret) as any;
    const tokenRecord = await Token.findOne({ refreshToken: refreshTokenStr, revoked: false }).exec();
    if (!tokenRecord) throw new AppError('INVALID_TOKEN', 'Token de refresco inválido', 401);
    if (tokenRecord.expiresAt < new Date()) {
      await tokenRecord.deleteOne().exec();
      throw new AppError('TOKEN_EXPIRED', 'Token de refresco expirado', 401);
    }
    const user = await User.findById(decoded.userId).exec();
    if (!user || user.status === 'locked') throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    if (user.emailVerified === false) {
      await Token.findOneAndUpdate({ refreshToken: refreshTokenStr }, { revoked: true }).exec();
      throw new AppError('EMAIL_NOT_VERIFIED', 'Verifica tu correo antes de iniciar sesión.', 403);
    }
    const permissions = await this.getPermissions(user);
    const newAccessToken = this.generateAccessToken(user, permissions);
    return { accessToken: newAccessToken };
  }

  async logout(refreshTokenStr: string, userId: string) {
    await Token.findOneAndUpdate({ refreshToken: refreshTokenStr, userId }, { revoked: true }).exec();
    return { success: true };
  }

  async logoutAll(userId: string, tenantId: string) {
    await Token.updateMany({ userId, tenantId }, { revoked: true }).exec();
    return { success: true };
  }

  async forgotPassword(email: string, tenantId: string) {
    const user = await User.findOne({ email, tenantId }).exec();
    if (!user) throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    const resetToken = jwt.sign({ userId: user._id, tenantId }, env.jwtSecret, { expiresIn: '1h' });
    return { resetToken, message: 'Token de recuperación generado' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).exec();
    if (!user) throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('PASSWORD_MISMATCH', 'Contraseña actual incorrecta', 400);
    const newHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    await User.findByIdAndUpdate(userId, { passwordHash: newHash }).exec();
    await Token.updateMany({ userId }, { revoked: true }).exec();
    return { success: true, message: 'Contraseña cambiada exitosamente' };
  }

  private async getPermissions(user: any): Promise<unknown[]> {
    const role = await Role.findOne({ tenantId: user.tenantId, roleId: user.roleId }).exec();
    return role?.permissions ?? user.permissions ?? [];
  }

  private async replaceEmailVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await EmailVerificationToken.findOneAndUpdate(
      { userId },
      {
        userId,
        tokenHash: hashVerificationToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return token;
  }

  private generateAccessToken(user: any, permissions: unknown[] = []): string {
    return jwt.sign({
      userId: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId || null,
      roleId: user.roleId,
      permissions,
    }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign({
      userId: user._id,
      tenantId: user.tenantId,
    }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'] });
  }

  private sanitizeUser(user: any, permissions: unknown[] = []) {
    return {
      id: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      status: user.status,
      permissions,
    };
  }
}

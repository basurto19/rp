import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '../../users/models/user.model';
import { Company } from '../../companies/models/company.model';
import { Role } from '../../roles/models/role.model';
import { Token } from '../models/token.model';
import { EmailVerificationToken } from '../models/email-verification-token.model';
import {
  logEmailDeliveryFailure,
  sendAdminRegistrationNotification,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './email.service';
import { AppError } from '../../shared/errors/app-error';
import { env } from '../../../config/env';
import { generateTenantId } from '../../shared/utils';
import { ROLES } from '@erp/constants';
import { copyPrimaryAdminPermissions } from './primary-admin-permissions';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

interface RegisteredUserNotification {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  registeredAt: Date;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const WELCOME_EMAIL_CLAIM_TTL_MS = 60 * 1000;
const RESEND_VERIFICATION_MESSAGE =
  'Si la cuenta existe y aún no está verificada, enviaremos un correo de verificación.';

function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ message: string }> {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
    const tenantId = generateTenantId();
    const roleId = ROLES.USER;
    const mongoSession = await mongoose.startSession();
    let registeredUser: RegisteredUserNotification | undefined;

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
          name: 'Usuario',
          description: 'Usuario estándar de la empresa',
          permissions: [],
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
          isPrimaryAdmin: false,
          status: 'active',
          emailVerified: false,
          emailVerifiedAt: null,
        });
        await user.save({ session: mongoSession });

        registeredUser = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: company.name,
          registeredAt: user.createdAt ?? new Date(),
        };
      });
    } finally {
      await mongoSession.endSession();
    }

    if (!registeredUser) throw new AppError('DATABASE_ERROR', 'No se pudo crear la cuenta');

    void this.notifyAdminOfRegistration(registeredUser).catch(() => {
      console.error('Admin registration notification failed', {
        context: 'admin_registration',
        category: 'unknown',
      });
    });

    return { message: 'Cuenta creada correctamente. Ya puedes iniciar sesión.' };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).exec();
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
    if (user.status === 'locked') throw new AppError('USER_LOCKED', 'Usuario bloqueado', 403);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
    const isConfiguredAdmin = user.email.trim().toLowerCase() === env.adminEmail;
    if (isConfiguredAdmin && user.isPrimaryAdmin !== true) {
      await User.findByIdAndUpdate(user._id, { isPrimaryAdmin: true }).exec();
      user.isPrimaryAdmin = true;
    }
    const effectiveRoleId = user.isPrimaryAdmin === true ? ROLES.SUPER_ADMIN : ROLES.USER;
    const permissions = await this.getPermissions(user);
    const accessToken = this.generateAccessToken(user, permissions, effectiveRoleId);
    const refreshToken = this.generateRefreshToken(user);

    await Token.create({
      userId: user._id.toString(),
      tenantId: user.tenantId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    if (!user.welcomeEmailSentAt) {
      void this.deliverWelcomeEmail(user._id.toString()).catch(() =>
        this.logWelcomeEmailStateFailure(),
      );
    }

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user, permissions, effectiveRoleId),
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const now = new Date();
    const verification = await EmailVerificationToken.findOneAndDelete({
      tokenHash: hashVerificationToken(token),
      expiresAt: { $gt: now },
    }).exec();

    if (!verification) {
      throw new AppError(
        'INVALID_VERIFICATION_TOKEN',
        'El enlace de verificación no es válido o ha expirado.',
        400,
      );
    }

    const user = await User.findByIdAndUpdate(
      verification.userId,
      { emailVerified: true, emailVerifiedAt: now },
      { new: true },
    ).exec();
    if (!user) {
      throw new AppError(
        'INVALID_VERIFICATION_TOKEN',
        'El enlace de verificación no es válido o ha expirado.',
        400,
      );
    }

    return { message: 'Correo verificado correctamente.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      $or: [{ emailVerified: false }, { emailVerified: { $exists: false } }],
    }).exec();
    if (!user) return { message: RESEND_VERIFICATION_MESSAGE };

    const token = await this.replaceEmailVerificationToken(user._id.toString());
    try {
      await sendVerificationEmail({ email: user.email, firstName: user.firstName, token });
    } catch (error: unknown) {
      logEmailDeliveryFailure(error, 'resend');
    }

    return { message: RESEND_VERIFICATION_MESSAGE };
  }

  async refreshToken(refreshTokenStr: string) {
    const decoded = jwt.verify(refreshTokenStr, env.jwtRefreshSecret) as any;
    const tokenRecord = await Token.findOne({
      refreshToken: refreshTokenStr,
      revoked: false,
    }).exec();
    if (!tokenRecord) throw new AppError('INVALID_TOKEN', 'Token de refresco inválido', 401);
    if (tokenRecord.expiresAt < new Date()) {
      await tokenRecord.deleteOne().exec();
      throw new AppError('TOKEN_EXPIRED', 'Token de refresco expirado', 401);
    }
    const user = await User.findById(decoded.userId).exec();
    if (!user || user.status === 'locked')
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    const isConfiguredAdmin = user.email.trim().toLowerCase() === env.adminEmail;
    if (isConfiguredAdmin && user.isPrimaryAdmin !== true) {
      await User.findByIdAndUpdate(user._id, { isPrimaryAdmin: true }).exec();
      user.isPrimaryAdmin = true;
    }
    const effectiveRoleId = user.isPrimaryAdmin === true ? ROLES.SUPER_ADMIN : ROLES.USER;
    const permissions = await this.getPermissions(user);
    const newAccessToken = this.generateAccessToken(user, permissions, effectiveRoleId);
    return { accessToken: newAccessToken };
  }

  async logout(refreshTokenStr: string, userId: string) {
    await Token.findOneAndUpdate(
      { refreshToken: refreshTokenStr, userId },
      { revoked: true },
    ).exec();
    return { success: true };
  }

  async logoutAll(userId: string, tenantId: string) {
    await Token.updateMany({ userId, tenantId }, { revoked: true }).exec();
    return { success: true };
  }

  async forgotPassword(_email: string, _tenantId: string) {
    throw new AppError(
      'PASSWORD_RECOVERY_UNAVAILABLE',
      'La recuperación de contraseña no está disponible actualmente',
      501,
    );
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
    const isConfiguredAdmin = user.email?.trim?.().toLowerCase() === env.adminEmail;
    if (user.isPrimaryAdmin !== true && !isConfiguredAdmin) return [];
    const role = await Role.findOne({
      tenantId: user.tenantId,
      roleId: ROLES.SUPER_ADMIN,
    }).exec();
    return role?.permissions ?? copyPrimaryAdminPermissions();
  }

  private async notifyAdminOfRegistration(user: RegisteredUserNotification): Promise<void> {
    if (!env.adminEmail) {
      logEmailDeliveryFailure(new Error('ADMIN_EMAIL is not configured'), 'admin_registration');
      return;
    }

    try {
      await sendAdminRegistrationNotification({ to: env.adminEmail, ...user });
    } catch (error: unknown) {
      logEmailDeliveryFailure(error, 'admin_registration');
    }
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

  private async deliverWelcomeEmail(userId: string): Promise<void> {
    const claimTime = new Date();
    const claimedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        welcomeEmailSentAt: null,
        $or: [
          { welcomeEmailSendingAt: null },
          {
            welcomeEmailSendingAt: {
              $lt: new Date(claimTime.getTime() - WELCOME_EMAIL_CLAIM_TTL_MS),
            },
          },
        ],
      },
      { $set: { welcomeEmailSendingAt: claimTime } },
      { new: true },
    ).exec();
    if (!claimedUser) return;

    try {
      await sendWelcomeEmail({
        email: claimedUser.email,
        firstName: claimedUser.firstName,
      });
    } catch (error: unknown) {
      logEmailDeliveryFailure(error, 'welcome');
      await User.findOneAndUpdate(
        { _id: userId, welcomeEmailSendingAt: claimTime },
        { $unset: { welcomeEmailSendingAt: 1 } },
      ).exec();
      return;
    }

    try {
      const markedUser = await User.findOneAndUpdate(
        { _id: userId, welcomeEmailSendingAt: claimTime },
        {
          $set: { welcomeEmailSentAt: new Date() },
          $unset: { welcomeEmailSendingAt: 1 },
        },
      ).exec();
      if (!markedUser) {
        this.logWelcomeEmailStateFailure();
      }
    } catch {
      this.logWelcomeEmailStateFailure();
    }
  }

  private logWelcomeEmailStateFailure(): void {
    console.error('Welcome email delivery state update failed', {
      category: 'database_error',
    });
  }

  private generateAccessToken(
    user: any,
    permissions: unknown[] = [],
    roleId: string = ROLES.USER,
  ): string {
    return jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId,
        branchId: user.branchId || null,
        roleId,
        isPrimaryAdmin: user.isPrimaryAdmin === true,
        permissions,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
    );
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId,
      },
      env.jwtRefreshSecret,
      { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'] },
    );
  }

  private sanitizeUser(user: any, permissions: unknown[] = [], roleId: string = ROLES.USER) {
    return {
      id: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId,
      status: user.status,
      permissions,
    };
  }
}

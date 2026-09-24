import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../users/models/user.model';
import { Token } from '../models/token.model';
import { AppError } from '../../shared/errors/app-error';
import { env } from '../../../config/env';
import { generateId } from '../../shared/utils';

export class AuthService {
  async login(email: string, password: string) {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
    if (user.status === 'locked') throw new AppError('USER_LOCKED', 'Usuario bloqueado', 403);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401);

    const accessToken = this.generateAccessToken(user);
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
      user: this.sanitizeUser(user),
    };
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
    const newAccessToken = this.generateAccessToken(user);
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

  private generateAccessToken(user: any): string {
    const permissions = user.permissions || [];
    return jwt.sign({
      userId: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId || null,
      roleId: user.roleId,
      permissions,
    }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  }

  private generateRefreshToken(user: any): string {
    return jwt.sign({
      userId: user._id,
      tenantId: user.tenantId,
    }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
  }

  private sanitizeUser(user: any) {
    return {
      id: user._id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      status: user.status,
      permissions: user.permissions || [],
    };
  }
}

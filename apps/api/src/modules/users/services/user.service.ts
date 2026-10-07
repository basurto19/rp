// apps/api/src/modules/users/services/user.service.ts
import { User } from '../models/user.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';
import { ROLES } from '@erp/constants';
import { env } from '../../../config/env';

export class UserService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(User as any);
  }

  async getAll(
    tenantId: string,
    branchId: string | null,
    filter: Record<string, unknown> = {},
    page?: number,
    limit?: number,
    acrossTenants = false,
  ) {
    return this.repository.findAll(tenantId, branchId, filter, { page, limit }, acrossTenants);
  }

  async getById(id: string, tenantId: string, acrossTenants = false) {
    const user = await this.repository.findById(id, tenantId, acrossTenants);
    if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return user;
  }

  async getByEmail(email: string, tenantId: string) {
    return User.findOne({ email, tenantId }).exec();
  }

  async create(data: Record<string, unknown>) {
    const normalizedData = { ...data };
    if (typeof normalizedData.email === 'string') {
      normalizedData.email = normalizedData.email.trim().toLowerCase();
    }
    const existing = await User.findOne({ email: normalizedData.email }).exec();
    if (existing)
      throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un usuario con ese email', 409);
    return this.repository.create({
      ...normalizedData,
      roleId: ROLES.USER,
      isPrimaryAdmin: false,
      emailVerified: false,
      emailVerifiedAt: null,
    } as any);
  }

  async update(
    id: string,
    tenantId: string,
    updateData: Record<string, unknown>,
    acrossTenants = false,
  ) {
    const existingUser = await this.repository.findById(id, tenantId, acrossTenants);
    if (!existingUser) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    const protectedAdmin = existingUser.email?.trim?.().toLowerCase() === env.adminEmail;
    const requestedAdmin = updateData.isPrimaryAdmin;
    if (protectedAdmin) {
      updateData.isPrimaryAdmin = true;
      updateData.roleId = ROLES.SUPER_ADMIN;
      if (updateData.status === 'locked') throw new AppError('FORBIDDEN', 'No se puede bloquear al administrador principal.', 403);
    } else if (requestedAdmin === true || requestedAdmin === 'true') {
      updateData.isPrimaryAdmin = true;
      updateData.roleId = ROLES.SUPER_ADMIN;
    } else if (requestedAdmin === false || requestedAdmin === 'false') {
      updateData.isPrimaryAdmin = false;
      updateData.roleId = ROLES.USER;
    } else {
      delete updateData.roleId;
      delete updateData.isPrimaryAdmin;
    }
    const user = await this.repository.updateById(id, tenantId, updateData, acrossTenants);
    if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return user;
  }

  async updatePassword(id: string, tenantId: string, newPasswordHash: string) {
    return this.repository.updateById(id, tenantId, { passwordHash: newPasswordHash });
  }

  async delete(id: string, tenantId: string, acrossTenants = false) {
    const existingUser = await this.repository.findById(id, tenantId, acrossTenants);
    if (existingUser?.isPrimaryAdmin === true) {
      throw new AppError('FORBIDDEN', 'No se puede eliminar al administrador principal.', 403);
    }
    const deleted = await this.repository.deleteById(id, tenantId, acrossTenants);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return { deleted: true };
  }

  async findByTenant(tenantId: string, page?: number, limit?: number) {
    return this.repository.findAll(tenantId, null, {}, { page, limit });
  }
}

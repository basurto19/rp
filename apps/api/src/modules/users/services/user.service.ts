// apps/api/src/modules/users/services/user.service.ts
import { User } from '../models/user.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';

export class UserService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(User as any);
  }

  async getAll(tenantId: string, branchId: string | null, filter: Record<string, unknown> = {}, page?: number, limit?: number) {
    return this.repository.findAll(tenantId, branchId, filter, { page, limit });
  }

  async getById(id: string, tenantId: string) {
    const user = await this.repository.findById(id, tenantId);
    if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return user;
  }

  async getByEmail(email: string, tenantId: string) {
    return User.findOne({ email, tenantId }).exec();
  }

  async create(data: Record<string, unknown>) {
    const existing = await User.findOne({ tenantId: data.tenantId, email: data.email }).exec();
    if (existing) throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un usuario con ese email', 409);
    return this.repository.create(data as any);
  }

  async update(id: string, tenantId: string, updateData: Record<string, unknown>) {
    const user = await this.repository.updateById(id, tenantId, updateData);
    if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return user;
  }

  async updatePassword(id: string, tenantId: string, newPasswordHash: string) {
    return this.repository.updateById(id, tenantId, { passwordHash: newPasswordHash });
  }

  async delete(id: string, tenantId: string) {
    const deleted = await this.repository.deleteById(id, tenantId);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Usuario no encontrado', 404);
    return { deleted: true };
  }

  async findByTenant(tenantId: string, page?: number, limit?: number) {
    return this.repository.findAll(tenantId, null, {}, { page, limit });
  }
}

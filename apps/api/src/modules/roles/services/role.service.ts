// apps/api/src/modules/roles/services/role.service.ts

import { Role } from '../models/role.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';

export class RoleService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(Role as any);
  }

  async getAll(tenantId: string) {
    return this.repository.findAll(tenantId, null, {});
  }

  async getById(id: string, tenantId: string) {
    const role = await this.repository.findById(id, tenantId);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return role;
  }

  async create(data: any) {
    const existing = await Role.findOne({ tenantId: data.tenantId, roleId: data.roleId }).exec();
    if (existing) throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un rol con ese ID', 409);
    return this.repository.create(data);
  }

  async update(id: string, tenantId: string, updateData: any) {
    const role = await this.repository.updateById(id, tenantId, updateData);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return role;
  }

  async delete(id: string, tenantId: string) {
    const role = await this.repository.findById(id, tenantId);
    if (role?.isSystem) throw new AppError('FORBIDDEN', 'No se puede eliminar un rol del sistema', 403);
    const deleted = await this.repository.deleteById(id, tenantId);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return { deleted: true };
  }
}

// apps/api/src/modules/roles/services/role.service.ts

import { Role } from '../models/role.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';
import { ROLES } from '@erp/constants';

export class RoleService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(Role as any);
  }

  async getAll(tenantId: string, acrossTenants = false) {
    return this.repository.findAll(tenantId, null, {}, undefined, acrossTenants);
  }

  async getById(id: string, tenantId: string, acrossTenants = false) {
    const role = await this.repository.findById(id, tenantId, acrossTenants);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return role;
  }

  async create(data: any) {
    if (data.roleId === ROLES.SUPER_ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        'El rol de administrador principal solo se crea mediante bootstrap.',
        403,
      );
    }
    const existing = await Role.findOne({ tenantId: data.tenantId, roleId: data.roleId }).exec();
    if (existing) throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un rol con ese ID', 409);
    return this.repository.create(data);
  }

  async update(id: string, tenantId: string, updateData: any, acrossTenants = false) {
    if (updateData.roleId === ROLES.SUPER_ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        'El rol de administrador principal solo se asigna mediante bootstrap.',
        403,
      );
    }
    const existing = await this.repository.findById(id, tenantId, acrossTenants);
    if (existing?.roleId === ROLES.SUPER_ADMIN) {
      throw new AppError(
        'FORBIDDEN',
        'El rol de administrador principal no puede modificarse.',
        403,
      );
    }
    const role = await this.repository.updateById(id, tenantId, updateData, acrossTenants);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return role;
  }

  async delete(id: string, tenantId: string, acrossTenants = false) {
    const role = await this.repository.findById(id, tenantId, acrossTenants);
    if (role?.isSystem || role?.roleId === ROLES.SUPER_ADMIN) {
      throw new AppError('FORBIDDEN', 'No se puede eliminar un rol del sistema', 403);
    }
    const deleted = await this.repository.deleteById(id, tenantId, acrossTenants);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Rol no encontrado', 404);
    return { deleted: true };
  }
}

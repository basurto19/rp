// apps/api/src/modules/branches/services/branch.service.ts
import { Branch } from '../models/branch.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';

export class BranchService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(Branch as any);
  }

  async getAll(
    tenantId: string,
    filter: Record<string, unknown> = {},
    page?: number,
    limit?: number,
    acrossTenants = false,
  ) {
    return this.repository.findAll(tenantId, null, filter, { page, limit }, acrossTenants);
  }

  async getById(id: string, tenantId: string, acrossTenants = false) {
    const branch = await this.repository.findById(id, tenantId, acrossTenants);
    if (!branch) throw new AppError('RESOURCE_NOT_FOUND', 'Sucursal no encontrada', 404);
    return branch;
  }

  async create(data: Record<string, unknown>) {
    const existing = await Branch.findOne({
      tenantId: data.tenantId,
      branchId: data.branchId,
    }).exec();
    if (existing)
      throw new AppError('DUPLICATE_RESOURCE', 'Ya existe una sucursal con ese ID', 409);
    return this.repository.create({ ...data, status: 'active' } as any);
  }

  async update(
    id: string,
    tenantId: string,
    updateData: Record<string, unknown>,
    acrossTenants = false,
  ) {
    const branch = await this.repository.updateById(id, tenantId, updateData, acrossTenants);
    if (!branch) throw new AppError('RESOURCE_NOT_FOUND', 'Sucursal no encontrada', 404);
    return branch;
  }

  async delete(id: string, tenantId: string, acrossTenants = false) {
    const deleted = await this.repository.deleteById(id, tenantId, acrossTenants);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Sucursal no encontrada', 404);
    return { deleted: true };
  }
}

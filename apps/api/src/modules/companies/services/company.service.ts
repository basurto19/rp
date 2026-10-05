// apps/api/src/modules/companies/services/company.service.ts
import { Company } from '../models/company.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';

export class CompanyService {
  private repository: BaseRepository<any>;

  constructor() {
    this.repository = new BaseRepository(Company as any);
  }

  async getAll(tenantId: string, branchId: string | null, filter: Record<string, unknown> = {}, page?: number, limit?: number) {
    return this.repository.findAll(tenantId, branchId, filter, { page, limit });
  }

  async getById(id: string, tenantId: string) {
    const company = await this.repository.findById(id, tenantId);
    if (!company) throw new AppError('RESOURCE_NOT_FOUND', 'Empresa no encontrada', 404);
    return company;
  }

  async create(data: Record<string, unknown>) {
    const existing = await Company.findOne({ tenantId: data.tenantId, email: data.email }).exec();
    if (existing) throw new AppError('DUPLICATE_RESOURCE', 'Ya existe una empresa con ese email', 409);
    return this.repository.create(data as any);
  }

  async update(id: string, tenantId: string, updateData: Record<string, unknown>) {
    const company = await this.repository.updateById(id, tenantId, updateData);
    if (!company) throw new AppError('RESOURCE_NOT_FOUND', 'Empresa no encontrada', 404);
    return company;
  }

  async delete(id: string, tenantId: string) {
    const deleted = await this.repository.deleteById(id, tenantId);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Empresa no encontrada', 404);
    return { deleted: true };
  }
}

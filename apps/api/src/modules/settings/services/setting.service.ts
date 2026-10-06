import { Setting } from '../models/setting.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';
import { ISetting } from '../models/setting.model';

export class SettingService {
  private repository: BaseRepository<ISetting>;

  constructor() {
    this.repository = new BaseRepository(Setting as any);
  }

  async getAll(tenantId: string, page?: number, limit?: number, acrossTenants = false) {
    return this.repository.findAll(tenantId, null, {}, { page, limit }, acrossTenants);
  }

  async getByKey(key: string, tenantId: string, acrossTenants = false) {
    const setting = await this.repository.findOne({ key, tenantId } as any, acrossTenants);
    if (!setting) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);
    return setting;
  }

  async upsert(
    tenantId: string,
    key: string,
    value: unknown,
    type: string,
    description: string,
    acrossTenants = false,
    targetTenantId?: string,
  ) {
    const scopedTenantId = acrossTenants ? targetTenantId || tenantId : tenantId;
    const existing = await this.repository.findOne({ key, tenantId: scopedTenantId } as any, false);
    if (existing) {
      const updated = await this.repository.updateById(
        existing.id || existing._id.toString(),
        scopedTenantId,
        { value, type, description } as any,
      );
      return updated;
    }
    return this.repository.create({
      tenantId: scopedTenantId,
      key,
      value,
      type,
      description,
    } as any);
  }

  async delete(key: string, tenantId: string, acrossTenants = false, targetTenantId?: string) {
    const scopedTenantId = acrossTenants ? targetTenantId || tenantId : tenantId;
    const setting = await this.repository.findOne({ key, tenantId: scopedTenantId } as any);
    if (!setting) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);

    const deleted = await this.repository.deleteById(setting._id.toString(), scopedTenantId);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);
    return { deleted: true };
  }
}

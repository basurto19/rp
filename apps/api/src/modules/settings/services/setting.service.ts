import { Setting } from '../models/setting.model';
import { BaseRepository } from '../../shared/repositories/base-repository';
import { AppError } from '../../shared/errors/app-error';
import { ISetting } from '../models/setting.model';

export class SettingService {
  private repository: BaseRepository<ISetting>;

  constructor() {
    this.repository = new BaseRepository(Setting as any);
  }

  async getAll(tenantId: string, page?: number, limit?: number) {
    return this.repository.findAll(tenantId, null, {}, { page, limit });
  }

  async getByKey(key: string, tenantId: string) {
    const setting = await this.repository.findOne({ key, tenantId } as any);
    if (!setting) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);
    return setting;
  }

  async upsert(tenantId: string, key: string, value: unknown, type: string, description: string) {
    const existing = await this.repository.findOne({ key, tenantId } as any);
    if (existing) {
      const updated = await this.repository.updateById(existing.id || existing._id.toString(), tenantId, {
        value, type, description,
      } as any);
      return updated;
    }
    return this.repository.create({ tenantId, key, value, type, description } as any);
  }

  async delete(key: string, tenantId: string) {
    const setting = await this.repository.findOne({ key, tenantId } as any);
    if (!setting) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);

    const deleted = await this.repository.deleteById(setting._id.toString(), tenantId);
    if (!deleted) throw new AppError('RESOURCE_NOT_FOUND', 'Configuración no encontrada', 404);
    return { deleted: true };
  }
}

// apps/api/src/modules/shared/repositories/base-repository.ts

import { Model, Document } from 'mongoose';

export interface FilterQuery {
  [key: string]: unknown;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class BaseRepository<T extends Document = Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  protected getTenantFilter(tenantId: string, acrossTenants: boolean): FilterQuery {
    return acrossTenants ? {} : { tenantId };
  }

  protected getBranchFilter(branchId: string | null): FilterQuery {
    if (!branchId) return {};
    return { branchId };
  }

  protected getCombinedFilter(
    tenantId: string,
    branchId: string | null,
    additionalFilter: FilterQuery = {},
    acrossTenants = false,
  ): FilterQuery {
    return {
      ...this.getTenantFilter(tenantId, acrossTenants),
      ...this.getBranchFilter(acrossTenants ? null : branchId),
      ...additionalFilter,
    };
  }

  async findById(id: string, tenantId: string, acrossTenants = false): Promise<T | null> {
    return this.model
      .findOne({ _id: id, ...this.getTenantFilter(tenantId, acrossTenants) })
      .exec() as Promise<T | null>;
  }

  async findAll(
    tenantId: string,
    branchId: string | null = null,
    filter: FilterQuery = {},
    pagination?: PaginationOptions & SortOptions,
    acrossTenants = false,
  ): Promise<{ data: T[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const { page = 1, limit = 20, sortBy, sortOrder } = pagination || {};
    const combinedFilter = this.getCombinedFilter(tenantId, branchId, filter, acrossTenants);

    const [total, data] = await Promise.all([
      this.model.countDocuments(combinedFilter).exec() as Promise<number>,
      this.model
        .find(combinedFilter as Record<string, unknown>)
        .sort(sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec() as Promise<T[]>,
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const document = new this.model(data);
    return document.save() as Promise<T>;
  }

  async updateById(
    id: string,
    tenantId: string,
    updateData: Record<string, unknown>,
    acrossTenants = false,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, ...this.getTenantFilter(tenantId, acrossTenants) },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      )
      .exec() as Promise<T | null>;
  }

  async deleteById(id: string, tenantId: string, acrossTenants = false): Promise<boolean> {
    const result = await this.model
      .deleteOne({ _id: id, ...this.getTenantFilter(tenantId, acrossTenants) })
      .exec();
    return result.deletedCount === 1;
  }

  async exists(filter: FilterQuery): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async findOne(filter: FilterQuery, acrossTenants = false): Promise<T | null> {
    if (!acrossTenants) return this.model.findOne(filter).exec() as Promise<T | null>;
    const globalFilter = Object.fromEntries(
      Object.entries(filter).filter(([key]) => key !== 'tenantId'),
    );
    return this.model.findOne(globalFilter).exec() as Promise<T | null>;
  }

  async count(filter: FilterQuery = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}

import mongoose, { type FilterQuery } from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { Customer, type ICustomer } from '../models/customer.model';

type CustomerInput = Partial<
  Pick<
    ICustomer,
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'address'
    | 'city'
    | 'state'
    | 'postalCode'
    | 'rfc'
    | 'notes'
    | 'status'
  >
>;

export class CustomerService {
  async list(
    tenantId: string,
    options: { search: string; page: number; limit: number },
  ): Promise<{ data: unknown[]; pagination: { total: number; page: number; limit: number; hasMore: boolean } }> {
    const filter: FilterQuery<ICustomer> = { tenantId };
    const search = options.search.trim();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Customer.find(filter)
        .sort({ firstName: 1, lastName: 1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean()
        .exec(),
      Customer.countDocuments(filter).exec(),
    ]);
    return {
      data,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        hasMore: options.page * options.limit < total,
      },
    };
  }

  async getById(tenantId: string, customerId: string): Promise<unknown> {
    if (!mongoose.isValidObjectId(customerId)) {
      throw new AppError('VALIDATION_ERROR', 'El identificador del cliente no es válido', 400);
    }
    const customer = await Customer.findOne({ _id: customerId, tenantId }).lean().exec();
    if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente no encontrado', 404);
    return customer;
  }

  async create(tenantId: string, input: CustomerInput): Promise<unknown> {
    try {
      return await Customer.create({
        ...input,
        email: input.email?.trim().toLowerCase() ?? '',
        tenantId,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un cliente con ese correo', 409);
      }
      throw error;
    }
  }

  async update(tenantId: string, customerId: string, input: CustomerInput): Promise<unknown> {
    if (!mongoose.isValidObjectId(customerId)) {
      throw new AppError('VALIDATION_ERROR', 'El identificador del cliente no es válido', 400);
    }
    const update = { ...input };
    if (update.email !== undefined) update.email = update.email.trim().toLowerCase();
    try {
      const customer = await Customer.findOneAndUpdate(
        { _id: customerId, tenantId },
        { $set: update },
        { new: true, runValidators: true },
      )
        .lean()
        .exec();
      if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente no encontrado', 404);
      return customer;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un cliente con ese correo', 409);
      }
      throw error;
    }
  }

  async remove(tenantId: string, customerId: string): Promise<unknown> {
    if (!mongoose.isValidObjectId(customerId)) throw new AppError('VALIDATION_ERROR', 'El identificador del cliente no es válido', 400);
    const customer = await Customer.findOneAndUpdate({ _id: customerId, tenantId }, { $set: { status: 'inactive' } }, { new: true }).lean().exec();
    if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente no encontrado', 404);
    return { deleted: true, softDeleted: true };
  }

  async setStatus(tenantId: string, customerId: string, status: 'active' | 'inactive'): Promise<unknown> {
    if (!mongoose.isValidObjectId(customerId)) {
      throw new AppError('VALIDATION_ERROR', 'El identificador del cliente no es válido', 400);
    }
    const customer = await Customer.findOneAndUpdate(
      { _id: customerId, tenantId },
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
    if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente no encontrado', 404);
    return customer;
  }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

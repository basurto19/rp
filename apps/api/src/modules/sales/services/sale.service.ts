import mongoose, { Types, type FilterQuery } from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { Customer } from '../../customers/models/customer.model';
import { InventoryMovement } from '../../products/models/inventory-movement.model';
import { Product, type IProduct } from '../../products/models/product.model';
import { Sale, type ISale, type ISaleItem } from '../models/sale.model';

export interface SaleLineInput {
  productId: string;
  quantity: number;
}

export interface SaleInput {
  customerId: string;
  items: SaleLineInput[];
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  notes?: string;
}

interface SaleFilters {
  customerId?: string;
  folio?: string;
  status?: 'completed';
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

interface DemoSaleOptions {
  saleDate: Date;
  demoSeedVersion: string;
  demoSaleIndex: number;
}

export class SaleService {
  async list(
    tenantId: string,
    filters: SaleFilters,
  ): Promise<{ data: unknown[]; pagination: { total: number; page: number; limit: number; hasMore: boolean } }> {
    const query: FilterQuery<ISale> = { tenantId };
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.folio) query.folio = { $regex: escapeRegex(filters.folio), $options: 'i' };
    if (filters.status) query.status = filters.status;
    if (filters.from || filters.to) {
      query.saleDate = {};
      if (filters.from) query.saleDate.$gte = filters.from;
      if (filters.to) query.saleDate.$lte = filters.to;
    }

    const [data, total] = await Promise.all([
      Sale.find(query)
        .sort({ saleDate: -1, _id: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit)
        .lean()
        .exec(),
      Sale.countDocuments(query).exec(),
    ]);
    return {
      data,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        hasMore: filters.page * filters.limit < total,
      },
    };
  }

  async getById(tenantId: string, saleId: string): Promise<unknown> {
    if (!mongoose.isValidObjectId(saleId)) {
      throw new AppError('VALIDATION_ERROR', 'El identificador de la venta no es válido', 400);
    }
    const sale = await Sale.findOne({ _id: saleId, tenantId }).lean().exec();
    if (!sale) throw new AppError('RESOURCE_NOT_FOUND', 'Venta no encontrada', 404);
    return sale;
  }

  async create(
    tenantId: string,
    userId: string,
    input: SaleInput,
    demo?: DemoSaleOptions,
  ): Promise<unknown> {
    if (!mongoose.isValidObjectId(input.customerId)) {
      throw new AppError('VALIDATION_ERROR', 'El identificador del cliente no es válido', 400);
    }

    const quantities = new Map<string, number>();
    for (const item of input.items) {
      if (!mongoose.isValidObjectId(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new AppError('VALIDATION_ERROR', 'Las partidas de venta no son válidas', 400);
      }
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    const session = await mongoose.startSession();
    let result: unknown;
    const saleDate = demo?.saleDate ?? new Date();
    const folio = demo
      ? `DEMO-${demo.demoSeedVersion}-${String(demo.demoSaleIndex).padStart(4, '0')}`
      : `V-${Date.now()}-${new Types.ObjectId().toString().slice(-8).toUpperCase()}`;

    try {
      await session.withTransaction(async () => {
        if (demo) {
          const existing = await Sale.findOne({
            tenantId,
            demoSeedVersion: demo.demoSeedVersion,
            demoSaleIndex: demo.demoSaleIndex,
          })
            .session(session)
            .lean()
            .exec();
          if (existing) {
            result = existing;
            return;
          }
        }

        const customer = await Customer.findOne({
          _id: input.customerId,
          tenantId,
          status: 'active',
        })
          .session(session)
          .exec();
        if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente activo no encontrado', 404);

        const items: ISaleItem[] = [];
        for (const [productId, quantity] of quantities) {
          const product = await Product.findOne({
            _id: productId,
            tenantId,
            status: 'active',
          })
            .session(session)
            .exec();
          if (!product) {
            const exists = await Product.exists({ _id: productId, tenantId }).session(session).exec();
            throw new AppError(
              exists ? 'PRODUCT_INACTIVE' : 'RESOURCE_NOT_FOUND',
              exists ? 'No se puede vender un producto inactivo' : 'Producto no encontrado',
              exists ? 409 : 404,
            );
          }

          const updated = await Product.findOneAndUpdate(
            { _id: product._id, tenantId, status: 'active', stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true, session, runValidators: true },
          ).exec();
          if (!updated) {
            throw new AppError('INSUFFICIENT_STOCK', `Stock insuficiente para ${product.name}`, 409);
          }

          const unitPrice = roundMoney(product.salePrice);
          const lineSubtotal = roundMoney(unitPrice * quantity);
          items.push({
            productId: product._id,
            sku: product.sku,
            productName: product.name,
            quantity,
            unitPrice,
            subtotal: lineSubtotal,
          });
          await InventoryMovement.create(
            [{
              tenantId,
              productId: product._id,
              userId,
              type: 'exit',
              quantity,
              stockBefore: updated.stock + quantity,
              stockAfter: updated.stock,
              notes: `Venta ${folio}`,
            }],
            { session },
          );
        }

        const subtotal = roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
        const [sale] = await Sale.create(
          [{
            tenantId,
            folio,
            customerId: customer._id,
            customerName: `${customer.firstName} ${customer.lastName}`.trim(),
            userId,
            saleDate,
            status: 'completed',
            items,
            subtotal,
            total: subtotal,
            paymentMethod: input.paymentMethod,
            notes: demo ? `[DEMO] ${input.notes ?? ''}`.trim() : input.notes ?? '',
            isDemo: Boolean(demo),
            ...(demo && {
              demoSeedVersion: demo.demoSeedVersion,
              demoSaleIndex: demo.demoSaleIndex,
            }),
          }],
          { session },
        );
        result = sale;
      });
    } catch (error) {
      if (demo && isDuplicateKeyError(error)) {
        const existing = await Sale.findOne({
          tenantId,
          demoSeedVersion: demo.demoSeedVersion,
          demoSaleIndex: demo.demoSaleIndex,
        })
          .lean()
          .exec();
        if (existing) return existing;
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (!result) throw new AppError('DATABASE_ERROR', 'No se pudo registrar la venta');
    return result;
  }
}

export function validateSaleDateRange(from?: Date, to?: Date): void {
  if (from && to && from.getTime() > to.getTime()) {
    throw new AppError('VALIDATION_ERROR', 'La fecha inicial debe ser anterior a la fecha final', 400);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

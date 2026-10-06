import mongoose, { type FilterQuery } from 'mongoose';
import PDFDocument from 'pdfkit';
import { AppError } from '../../shared/errors/app-error';
import { InventoryMovement } from '../models/inventory-movement.model';
import { Product, type IProduct } from '../models/product.model';

type ProductInput = Partial<
  Pick<
    IProduct,
    | 'name'
    | 'description'
    | 'sku'
    | 'category'
    | 'costPrice'
    | 'salePrice'
    | 'stock'
    | 'minimumStock'
    | 'unit'
    | 'status'
  >
>;

export class ProductService {
  async list(tenantId: string, search = ''): Promise<unknown[]> {
    const filter: FilterQuery<IProduct> = { tenantId };
    const normalizedSearch = search.trim();
    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { sku: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    return Product.find(filter).sort({ name: 1 }).limit(200).lean().exec();
  }

  async summaryPdf(tenantId: string): Promise<Buffer> {
    const products = await Product.find({ tenantId }).sort({ category: 1, name: 1 }).limit(500).lean().exec();
    const active = products.filter((product) => product.status === 'active');
    const lowStock = active.filter((product) => product.stock <= product.minimumStock);
    const inventoryCost = products.reduce((sum, product) => sum + product.costPrice * product.stock, 0);
    const inventorySale = products.reduce((sum, product) => sum + product.salePrice * product.stock, 0);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(17).fillColor('#17365D').text('Apta Digital', { align: 'center' });
      doc.moveDown(0.3).fontSize(14).fillColor('#111827').text('Resumen de productos', { align: 'center' });
      doc.moveDown().fontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`);
      doc.text(`Productos: ${products.length} | Activos: ${active.length} | Stock bajo: ${lowStock.length}`);
      doc.text(`Valor de inventario a costo: ${money(inventoryCost)}`);
      doc.text(`Valor potencial a precio de venta: ${money(inventorySale)}`);
      doc.moveDown();

      for (const product of products) {
        if (doc.y > doc.page.height - 70) doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold').text(`${product.sku} · ${product.name}`);
        doc.font('Helvetica').fontSize(8).text(
          `${product.category || 'Sin categoría'} | Stock: ${product.stock} ${product.unit} | Venta: ${money(product.salePrice)} | ${product.status === 'active' ? 'Activo' : 'Inactivo'}`,
        );
        doc.moveDown(0.35);
      }
      doc.end();
    });
  }

  async getById(tenantId: string, productId: string): Promise<unknown> {
    const product = await Product.findOne({ _id: productId, tenantId }).lean().exec();
    if (!product) throw new AppError('RESOURCE_NOT_FOUND', 'Producto no encontrado', 404);
    return product;
  }

  async create(tenantId: string, input: ProductInput): Promise<unknown> {
    try {
      return await Product.create({
        ...input,
        sku: input.sku?.trim().toUpperCase(),
        tenantId,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un producto con ese SKU', 409);
      }
      throw error;
    }
  }

  async update(tenantId: string, productId: string, input: ProductInput): Promise<unknown> {
    const update = { ...input };
    if (update.sku !== undefined) update.sku = update.sku.trim().toUpperCase();
    try {
      const product = await Product.findOneAndUpdate(
        { _id: productId, tenantId },
        { $set: update },
        { new: true, runValidators: true },
      )
        .lean()
        .exec();
      if (!product) throw new AppError('RESOURCE_NOT_FOUND', 'Producto no encontrado', 404);
      return product;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new AppError('DUPLICATE_RESOURCE', 'Ya existe un producto con ese SKU', 409);
      }
      throw error;
    }
  }

  async setStatus(
    tenantId: string,
    productId: string,
    status: 'active' | 'inactive',
  ): Promise<unknown> {
    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId },
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
    if (!product) throw new AppError('RESOURCE_NOT_FOUND', 'Producto no encontrado', 404);
    return product;
  }

  async adjustInventory(
    tenantId: string,
    productId: string,
    userId: string,
    input: { type: 'entry' | 'exit'; quantity: number; notes?: string },
  ): Promise<{ product: unknown; movement: unknown }> {
    const session = await mongoose.startSession();
    let result: { product: unknown; movement: unknown } | undefined;

    try {
      await session.withTransaction(async () => {
        const delta = input.type === 'entry' ? input.quantity : -input.quantity;
        const filter: FilterQuery<IProduct> = {
          _id: productId,
          tenantId,
          status: 'active',
        };
        if (input.type === 'exit') filter.stock = { $gte: input.quantity };

        const product = await Product.findOneAndUpdate(
          filter,
          { $inc: { stock: delta } },
          { new: true, session, runValidators: true },
        ).exec();

        if (!product) {
          const existing = await Product.findOne({ _id: productId, tenantId }).session(session).exec();
          if (!existing) throw new AppError('RESOURCE_NOT_FOUND', 'Producto no encontrado', 404);
          if (existing.status !== 'active') {
            throw new AppError('PRODUCT_INACTIVE', 'No se puede mover inventario de un producto inactivo', 409);
          }
          throw new AppError('INSUFFICIENT_STOCK', 'La salida supera el stock disponible', 409);
        }

        const stockAfter = product.stock;
        const stockBefore = stockAfter - delta;
        const [movement] = await InventoryMovement.create(
          [
            {
              tenantId,
              productId: product._id,
              userId,
              type: input.type,
              quantity: input.quantity,
              stockBefore,
              stockAfter,
              notes: input.notes ?? '',
            },
          ],
          { session },
        );
        result = { product, movement };
      });
    } finally {
      await session.endSession();
    }

    if (!result) throw new AppError('DATABASE_ERROR', 'No se pudo registrar el movimiento de inventario');
    return result;
  }

  async listMovements(tenantId: string, productId: string): Promise<unknown[]> {
    const product = await Product.exists({ _id: productId, tenantId }).exec();
    if (!product) throw new AppError('RESOURCE_NOT_FOUND', 'Producto no encontrado', 404);
    return InventoryMovement.find({ tenantId, productId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
  }
}

function money(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

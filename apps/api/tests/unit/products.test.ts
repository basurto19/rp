import {
  createProductSchema,
  inventoryMovementSchema,
  updateProductSchema,
} from '@erp/validation';
import mongoose from 'mongoose';
import { AppError } from '../../src/modules/shared/errors/app-error';
import { InventoryMovement } from '../../src/modules/products/models/inventory-movement.model';
import { Product } from '../../src/modules/products/models/product.model';
import { ProductService } from '../../src/modules/products/services/product.service';

jest.mock('../../src/modules/products/models/product.model', () => ({
  Product: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../src/modules/products/models/inventory-movement.model', () => ({
  InventoryMovement: {
    create: jest.fn(),
  },
}));

describe('product validation and tenant filtering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('validates the product fields and supplies inventory defaults', () => {
    expect(
      createProductSchema.parse({
        name: 'Cable USB',
        sku: 'usb-1',
      }),
    ).toMatchObject({
      name: 'Cable USB',
      sku: 'usb-1',
      stock: 0,
      minimumStock: 0,
      status: 'active',
    });
  });

  it('rejects negative prices and stock', () => {
    expect(
      createProductSchema.safeParse({
        name: 'Cable USB',
        sku: 'usb-1',
        salePrice: -1,
      }).success,
    ).toBe(false);
    expect(
      inventoryMovementSchema.safeParse({ type: 'exit', quantity: -2 }).success,
    ).toBe(false);
  });

  it('does not allow product updates to change stock outside inventory movements', () => {
    const result = updateProductSchema.safeParse({ stock: 100 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty('stock');
  });

  it('always scopes product searches to the authenticated tenant', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    (Product.find as jest.Mock).mockReturnValue(query);

    await new ProductService().list('tenant-a', 'cable');

    expect(Product.find).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      $or: [
        { name: { $regex: 'cable', $options: 'i' } },
        { sku: { $regex: 'cable', $options: 'i' } },
        { category: { $regex: 'cable', $options: 'i' } },
      ],
    });
    expect(query.limit).toHaveBeenCalledWith(200);
  });

  it('records stock exits transactionally with a nonnegative-stock condition', async () => {
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    (Product.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'product-id', stock: 2 }),
    });
    (InventoryMovement.create as jest.Mock).mockResolvedValue([
      { type: 'exit', quantity: 1, stockBefore: 3, stockAfter: 2 },
    ]);

    await new ProductService().adjustInventory('tenant-a', 'product-id', 'user-a', {
      type: 'exit',
      quantity: 1,
    });

    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-a', stock: { $gte: 1 } }),
      { $inc: { stock: -1 } },
      expect.objectContaining({ session, new: true }),
    );
    expect(InventoryMovement.create).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('rejects inventory exits that exceed available stock', async () => {
    const session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    (Product.findOneAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    const existingQuery = {
      session: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ stock: 0, status: 'active' }),
    };
    (Product.findOne as jest.Mock).mockReturnValue(existingQuery);

    await expect(
      new ProductService().adjustInventory('tenant-a', 'product-id', 'user-a', {
        type: 'exit',
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });

    expect(InventoryMovement.create).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });
});

import { connectDB, disconnectDatabase } from '../config/database';
import { Product } from '../modules/products/models/product.model';
import { User } from '../modules/users/models/user.model';

const SEED_VERSION = 'products-100-v1';
const targetEmail = process.argv[2]?.trim().toLowerCase();

const categories = ['Tecnología', 'Oficina', 'Hogar', 'Accesorios', 'Herramientas', 'Papelería', 'Limpieza', 'Almacén'];
const productTypes = ['Producto estándar', 'Artículo comercial', 'Insumo general', 'Accesorio', 'Consumible'];

async function main(): Promise<void> {
  if (!targetEmail) throw new Error('Indica el correo del usuario destino como argumento.');
  await connectDB();
  const user = await User.findOne({ email: targetEmail, status: 'active' }).select({ tenantId: 1 }).lean().exec();
  if (!user?.tenantId) throw new Error('No se encontró un usuario activo para cargar los productos.');

  const operations = Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    const category = categories[index % categories.length];
    const costPrice = 25 + ((index * 17) % 475);
    const margin = 1.25 + ((index % 6) * 0.05);
    const salePrice = Math.round(costPrice * margin * 100) / 100;
    const stock = 8 + ((index * 13) % 143);
    const minimumStock = 5 + (index % 16);
    const sku = `DEMO-PROD-${String(number).padStart(3, '0')}`;
    return {
      updateOne: {
        filter: { tenantId: user.tenantId, sku },
        update: {
          $set: {
            name: `${productTypes[index % productTypes.length]} ${String(number).padStart(3, '0')}`,
            description: `Registro demostrativo ${number} para pruebas del catálogo de Apta Digital.`,
            category,
            costPrice,
            salePrice,
            stock,
            minimumStock,
            unit: 'unidad',
            status: 'active' as const,
            isDemo: true,
            demoSeedVersion: SEED_VERSION,
          },
          $setOnInsert: { tenantId: user.tenantId, sku },
        },
        upsert: true,
      },
    };
  });

  await Product.bulkWrite(operations, { ordered: false });
  const count = await Product.countDocuments({ tenantId: user.tenantId, demoSeedVersion: SEED_VERSION });
  console.info(`Productos demo disponibles: ${count}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Error al cargar productos demo.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });

import { connectDB, disconnectDatabase } from '../config/database';
import { Product } from '../modules/products/models/product.model';
import { User } from '../modules/users/models/user.model';

const SEED_VERSION = 'products-100-v1';
const targetEmail = process.argv[2]?.trim().toLowerCase();

const categories = ['Tecnología', 'Oficina', 'Hogar', 'Accesorios', 'Herramientas', 'Papelería', 'Limpieza', 'Almacén'];
const realProductNames = ["Laptop Lenovo IdeaPad 15","Monitor LG 24 pulgadas","Teclado Logitech K120","Mouse Logitech M90","Impresora Epson EcoTank L3250","SSD Kingston 1 TB","Memoria USB SanDisk 64 GB","Disco duro externo Seagate 2 TB","Router TP-Link Archer C6","Switch TP-Link 8 puertos","Cable HDMI 2 m","Cable Ethernet Cat6 5 m","Audífonos JBL Tune 510BT","Webcam Logitech C270","Bocinas Logitech Z120","Regulador Koblenz 1000 VA","No Break APC 900 VA","Silla ejecutiva ergonómica","Escritorio de oficina 120 cm","Archivero metálico 4 gavetas","Papel bond carta 500 hojas","Cuaderno profesional 100 hojas","Bolígrafo BIC negro caja 12","Lápiz Dixon No. 2 caja 12","Marcadores Sharpie paquete 4","Notas adhesivas Post-it","Carpeta tamaño carta","Folder manila paquete 100","Engrapadora estándar","Grapas estándar caja 5000","Perforadora de 2 orificios","Cinta adhesiva transparente","Despachador de cinta","Tijeras de oficina 8 pulgadas","Calculadora Casio de escritorio","Tóner HP 85A compatible","Cartucho Epson 544 negro","Cartucho Epson 544 cian","Cartucho Epson 544 magenta","Cartucho Epson 544 amarillo","Papel fotográfico brillante carta","Etiquetas adhesivas carta","Rollo térmico 80 mm","Lector de código de barras USB","Impresora térmica de tickets","Cajón de dinero metálico","Terminal punto de venta Android","Tablet Samsung Galaxy Tab A9","Smartphone Motorola Moto G","Cargador USB-C 20 W","Power bank 10000 mAh","Hub USB 4 puertos","Adaptador USB-C a HDMI","Soporte para laptop aluminio","Base enfriadora para laptop","Mochila para laptop 15.6","Maletín ejecutivo para laptop","Candado de seguridad para laptop","Extensión eléctrica 6 contactos","Multicontacto con supresor","Foco LED 12 W","Lámpara de escritorio LED","Ventilador de escritorio","Cafetera Oster 12 tazas","Dispensador de agua","Vaso térmico acero inoxidable","Botella de agua 1 L","Papel higiénico paquete 12","Toalla de papel paquete 6","Jabón líquido 1 L","Gel antibacterial 1 L","Limpiador multiusos 1 L","Desinfectante en aerosol","Bolsas para basura paquete 30","Escoba reforzada","Recogedor de plástico","Trapeador de microfibra","Cubeta 12 L","Guantes de limpieza","Destornillador Phillips","Destornillador plano","Juego de llaves Allen","Pinza universal 8 pulgadas","Martillo 16 oz","Flexómetro 5 m","Cutter profesional","Cinta de aislar negra","Cinchos plásticos paquete 100","Caja organizadora plástica","Estante metálico 5 niveles","Tarima plástica industrial","Caja de cartón mediana paquete 10","Plástico burbuja rollo 10 m","Cinta para empaque 48 mm","Marcador permanente negro","Báscula digital 40 kg","Diablito de carga plegable","Chaleco reflejante","Casco de seguridad industrial","Botiquín de primeros auxilios"];

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
            name: realProductNames[index],
            description: `Producto comercial de demostración para el catálogo general de Apta Digital. Registro ${number}.`,
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

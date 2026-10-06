import PDFDocument from 'pdfkit';
import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { Customer } from '../../customers/models/customer.model';
import { Product } from '../../products/models/product.model';
import { Sale } from '../../sales/models/sale.model';

const MAX_CUSTOMER_PDF_SALES = 500;
const MAX_SALES_PDF_ROWS = 1000;
const MAX_REPORT_DAYS = 366;

interface DateRange {
  from?: Date;
  to?: Date;
}

export class ReportService {
  async customerPurchases(
    tenantId: string,
    customerId: string,
    options: { from?: Date; to?: Date; page: number; limit: number },
  ): Promise<unknown> {
    const customer = await Customer.findOne({ _id: customerId, tenantId }).lean().exec();
    if (!customer) throw new AppError('RESOURCE_NOT_FOUND', 'Cliente no encontrado', 404);

    const match: Record<string, unknown> = {
      tenantId,
      customerId: new Types.ObjectId(customerId),
    };
    if (options.from || options.to) {
      match.saleDate = {
        ...(options.from && { $gte: options.from }),
        ...(options.to && { $lte: options.to }),
      };
    }

    const [summaryRows, sales, totalSales, acquiredProducts] = await Promise.all([
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            firstPurchase: { $min: '$saleDate' },
            lastPurchase: { $max: '$saleDate' },
          },
        },
      ]).exec(),
      Sale.find(match)
        .sort({ saleDate: -1, _id: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean()
        .exec(),
      Sale.countDocuments(match).exec(),
      Sale.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            sku: { $first: '$items.sku' },
            productName: { $first: '$items.productName' },
            quantity: { $sum: '$items.quantity' },
            amount: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { amount: -1 } },
        { $limit: 100 },
      ]).exec(),
    ]);
    const summary = summaryRows[0] ?? {
      count: 0,
      totalSpent: 0,
      firstPurchase: null,
      lastPurchase: null,
    };

    return {
      customer,
      summary: {
        totalPurchases: summary.count,
        totalSpent: roundMoney(summary.totalSpent),
        firstPurchase: summary.firstPurchase,
        lastPurchase: summary.lastPurchase,
      },
      sales,
      products: acquiredProducts,
      pagination: {
        total: totalSales,
        page: options.page,
        limit: options.limit,
        hasMore: options.page * options.limit < totalSales,
      },
    };
  }

  async getSale(tenantId: string, saleId: string): Promise<Record<string, any>> {
    const sale = await Sale.findOne({ _id: saleId, tenantId }).lean().exec();
    if (!sale) throw new AppError('RESOURCE_NOT_FOUND', 'Venta no encontrada', 404);
    return sale as Record<string, any>;
  }

  async customerPurchasesPdf(tenantId: string, customerId: string): Promise<Buffer> {
    const data = await this.customerPurchases(tenantId, customerId, {
      page: 1,
      limit: MAX_CUSTOMER_PDF_SALES,
    }) as Record<string, any>;

    return createPdf((doc) => {
      addHeading(doc, 'Historial de compras del cliente');
      const customer = data.customer;
      doc.fontSize(10).text(`Cliente: ${`${customer.firstName} ${customer.lastName}`.trim()}`);
      doc.text(`Correo: ${customer.email || 'No registrado'}   Teléfono: ${customer.phone || 'No registrado'}`);
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`);
      doc.text(`Número de compras: ${data.summary.totalPurchases}`);
      doc.text(`Total gastado: ${money(data.summary.totalSpent)}`);
      doc.moveDown();
      addTableHeader(doc, ['Folio / fecha', 'Producto', 'Cant.', 'Precio', 'Importe']);
      for (const sale of data.sales as Array<Record<string, any>>) {
        for (const item of sale.items as Array<Record<string, any>>) {
          addTableRow(doc, [
            `${sale.folio}\n${dateText(sale.saleDate)}`,
            `${item.productName}\n${item.sku}`,
            String(item.quantity),
            money(item.unitPrice),
            money(item.subtotal),
          ]);
        }
        addSeparator(doc);
      }
      if (data.pagination.total > MAX_CUSTOMER_PDF_SALES) {
        doc.moveDown().fontSize(9).text(
          `Se muestran las ${MAX_CUSTOMER_PDF_SALES} compras más recientes de ${data.pagination.total}.`,
        );
      }
      doc.moveDown().fontSize(11).text(`Resumen total: ${money(data.summary.totalSpent)}`, { align: 'right' });
    });
  }

  async salePdf(tenantId: string, saleId: string): Promise<Buffer> {
    const sale = await this.getSale(tenantId, saleId);
    return createPdf((doc) => {
      addHeading(doc, 'Comprobante de venta');
      doc.fontSize(11).text(`Folio: ${sale.folio}`);
      doc.text(`Fecha: ${dateText(sale.saleDate)}`);
      doc.text(`Cliente: ${sale.customerName}`);
      doc.text(`Método de pago: ${paymentText(sale.paymentMethod)}`);
      doc.moveDown();
      addTableHeader(doc, ['Producto', 'SKU', 'Cantidad', 'Precio', 'Importe']);
      for (const item of sale.items as Array<Record<string, any>>) {
        addTableRow(doc, [
          item.productName,
          item.sku,
          String(item.quantity),
          money(item.unitPrice),
          money(item.subtotal),
        ]);
      }
      addSeparator(doc);
      doc.moveDown().fontSize(11).text(`Subtotal: ${money(sale.subtotal)}`, { align: 'right' });
      doc.fontSize(14).text(`Total: ${money(sale.total)}`, { align: 'right' });
      if (sale.notes) doc.moveDown().fontSize(9).text(`Notas: ${sale.notes}`);
    });
  }

  async salesPdf(tenantId: string, range: { from: Date; to: Date }): Promise<Buffer> {
    validateReportRange(range.from, range.to);
    const query = { tenantId, saleDate: { $gte: range.from, $lte: range.to } };
    const [count, sales] = await Promise.all([
      Sale.countDocuments(query).exec(),
      Sale.find(query).sort({ saleDate: -1, _id: -1 }).limit(MAX_SALES_PDF_ROWS + 1).lean().exec(),
    ]);
    if (count > MAX_SALES_PDF_ROWS) {
      throw new AppError(
        'REPORT_LIMIT_EXCEEDED',
        `El periodo supera el límite de ${MAX_SALES_PDF_ROWS} ventas; acota las fechas.`,
        422,
      );
    }
    const total = roundMoney(sales.reduce((sum, sale) => sum + sale.total, 0));

    return createPdf((doc) => {
      addHeading(doc, 'Reporte de ventas');
      doc.fontSize(10).text(`Periodo: ${dateText(range.from)} - ${dateText(range.to)}`);
      doc.text(`Ventas: ${count}   Ingresos: ${money(total)}`);
      doc.moveDown();
      addTableHeader(doc, ['Folio', 'Fecha', 'Cliente', 'Partidas', 'Total']);
      for (const sale of sales) {
        addTableRow(doc, [
          sale.folio,
          dateText(sale.saleDate),
          sale.customerName,
          String(sale.items.length),
          money(sale.total),
        ]);
      }
      addSeparator(doc);
      doc.moveDown().fontSize(12).text(`Total del periodo: ${money(total)}`, { align: 'right' });
    });
  }

  async statistics(tenantId: string, range: DateRange = {}): Promise<unknown> {
    const to = range.to ?? new Date();
    const from = range.from ?? new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
    validateReportRange(from, to);
    const match = { tenantId, saleDate: { $gte: from, $lte: to } };

    const [summaryRows, monthlySales, topCustomers, topProducts, lowStockProducts] = await Promise.all([
      Sale.aggregate([
        { $match: match },
        { $group: { _id: null, sales: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ]).exec(),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$saleDate', timezone: 'UTC' } },
            sales: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]).exec(),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$customerId',
            customerName: { $first: '$customerName' },
            sales: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]).exec(),
      Sale.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            sku: { $first: '$items.sku' },
            productName: { $first: '$items.productName' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]).exec(),
      Product.find({
        tenantId,
        status: 'active',
        $expr: { $lte: ['$stock', '$minimumStock'] },
      })
        .sort({ stock: 1, name: 1 })
        .limit(100)
        .select({ name: 1, sku: 1, stock: 1, minimumStock: 1, unit: 1 })
        .lean()
        .exec(),
    ]);
    const summary = summaryRows[0] ?? { sales: 0, revenue: 0 };
    return {
      period: { from, to },
      sales: summary.sales,
      revenue: roundMoney(summary.revenue),
      averageTicket: summary.sales ? roundMoney(summary.revenue / summary.sales) : 0,
      salesByMonth: monthlySales,
      topCustomers,
      topProducts,
      lowStockProducts,
    };
  }
}

function validateReportRange(from: Date, to: Date): void {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
    throw new AppError('VALIDATION_ERROR', 'El rango de fechas no es válido', 400);
  }
  if (to.getTime() - from.getTime() > MAX_REPORT_DAYS * 24 * 60 * 60 * 1000) {
    throw new AppError('REPORT_RANGE_TOO_LARGE', 'El periodo máximo del reporte es de 366 días', 400);
  }
}

function createPdf(draw: (document: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));
    try {
      draw(document);
      document.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addHeading(document: PDFKit.PDFDocument, title: string): void {
  document.fontSize(17).fillColor('#17365D').text('Apta Digital', { align: 'center' });
  document.moveDown(0.3).fontSize(14).fillColor('#111827').text(title, { align: 'center' });
  document.moveDown();
}

const columnWidths = [120, 170, 55, 75, 95];

function addTableHeader(document: PDFKit.PDFDocument, labels: string[]): void {
  ensureSpace(document, 26);
  let x = document.page.margins.left;
  document.fontSize(8).font('Helvetica-Bold');
  labels.forEach((label, index) => {
    document.text(label, x, document.y, { width: columnWidths[index], lineBreak: false });
    x += columnWidths[index];
  });
  document.moveDown(0.8).font('Helvetica');
  addSeparator(document);
}

function addTableRow(document: PDFKit.PDFDocument, values: string[]): void {
  const lines = Math.max(...values.map((value) => value.split('\n').length));
  const rowHeight = lines > 1 ? 32 : 18;
  ensureSpace(document, rowHeight + 2);
  const y = document.y;
  let x = document.page.margins.left;
  document.fontSize(8);
  values.forEach((value, index) => {
    document.text(value, x, y, {
      width: columnWidths[index] - 4,
      height: rowHeight,
      ellipsis: true,
    });
    x += columnWidths[index];
  });
  document.y = y + rowHeight;
}

function addSeparator(document: PDFKit.PDFDocument): void {
  const y = document.y + 3;
  document.moveTo(document.page.margins.left, y)
    .lineTo(document.page.width - document.page.margins.right, y)
    .strokeColor('#D1D5DB')
    .stroke();
  document.y = y + 7;
}

function ensureSpace(document: PDFKit.PDFDocument, height: number): void {
  if (document.y + height > document.page.height - document.page.margins.bottom) {
    document.addPage();
  }
}

function money(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

function dateText(value: Date | string): string {
  return new Date(value).toLocaleDateString('es-MX');
}

function paymentText(value: string): string {
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    bank_transfer: 'Transferencia',
    other: 'Otro',
  };
  return labels[value] ?? 'Otro';
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

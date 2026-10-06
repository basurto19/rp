import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authenticateToken, validateTenant } from '../../../middleware';
import { ReportController } from '../../reports/controllers/report.controller';
import { SaleController } from '../controllers/sale.controller';

export const saleRoutes: Router = Router();
const controller = new SaleController();
const reports = new ReportController();

function asyncRoute(
  handler: (request: Request, response: Response) => Promise<Response>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

saleRoutes.use(authenticateToken, validateTenant);
saleRoutes.get('/', asyncRoute(controller.list.bind(controller)));
saleRoutes.post('/', asyncRoute(controller.create.bind(controller)));
saleRoutes.get('/:id.pdf', asyncRoute(reports.salePdf.bind(reports)));
saleRoutes.get('/:id', asyncRoute(controller.getById.bind(controller)));

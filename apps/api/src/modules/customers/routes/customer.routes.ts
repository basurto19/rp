import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authenticateToken, validateTenant } from '../../../middleware';
import { CustomerController } from '../controllers/customer.controller';
import { ReportController } from '../../reports/controllers/report.controller';

export const customerRoutes: Router = Router();
const controller = new CustomerController();
const reports = new ReportController();

function asyncRoute(
  handler: (request: Request, response: Response) => Promise<Response>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

customerRoutes.use(authenticateToken, validateTenant);
customerRoutes.get('/', asyncRoute(controller.list.bind(controller)));
customerRoutes.post('/', asyncRoute(controller.create.bind(controller)));
customerRoutes.get('/:id/purchases.pdf', asyncRoute(reports.customerPurchasesPdf.bind(reports)));
customerRoutes.get('/:id/purchases', asyncRoute(reports.customerPurchases.bind(reports)));
customerRoutes.get('/:id', asyncRoute(controller.getById.bind(controller)));
customerRoutes.put('/:id', asyncRoute(controller.update.bind(controller)));
customerRoutes.patch('/:id', asyncRoute(controller.update.bind(controller)));
customerRoutes.patch('/:id/status', asyncRoute(controller.setStatus.bind(controller)));

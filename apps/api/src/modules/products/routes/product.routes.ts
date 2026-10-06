import { Router, type Request, type RequestHandler, type Response } from 'express';
import { authenticateToken, validateTenant } from '../../../middleware';
import { ProductController } from '../controllers/product.controller';

export const productRoutes: Router = Router();
const controller = new ProductController();

function asyncRoute(
  handler: (request: Request, response: Response) => Promise<Response>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

productRoutes.use(authenticateToken, validateTenant);
productRoutes.get('/', asyncRoute(controller.list.bind(controller)));
productRoutes.post('/', asyncRoute(controller.create.bind(controller)));
productRoutes.get('/:id', asyncRoute(controller.getById.bind(controller)));
productRoutes.put('/:id', asyncRoute(controller.update.bind(controller)));
productRoutes.patch('/:id/status', asyncRoute(controller.setStatus.bind(controller)));
productRoutes.delete('/:id', asyncRoute(controller.archive.bind(controller)));
productRoutes.get('/:id/inventory', asyncRoute(controller.listMovements.bind(controller)));
productRoutes.post('/:id/inventory', asyncRoute(controller.adjustInventory.bind(controller)));

// apps/api/src/modules/companies/routes/company.routes.ts
import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const companyRoutes: Router = Router();
const controller = new CompanyController();

companyRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.COMPANIES, action: 'read' }]), controller.getAll.bind(controller))
  .post(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.COMPANIES, action: 'create' }]), controller.create.bind(controller));

companyRoutes.route('/:id')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.COMPANIES, action: 'read' }]), controller.getById.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.COMPANIES, action: 'update' }]), controller.update.bind(controller))
  .delete(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.COMPANIES, action: 'delete' }]), controller.delete.bind(controller));

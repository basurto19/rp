// apps/api/src/modules/branches/routes/branch.routes.ts
import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const branchRoutes: Router = Router();
const controller = new BranchController();

branchRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.BRANCHES, action: 'read' }]), controller.getAll.bind(controller))
  .post(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.BRANCHES, action: 'create' }]), controller.create.bind(controller));

branchRoutes.route('/:id')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.BRANCHES, action: 'read' }]), controller.getById.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.BRANCHES, action: 'update' }]), controller.update.bind(controller))
  .delete(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.BRANCHES, action: 'delete' }]), controller.delete.bind(controller));

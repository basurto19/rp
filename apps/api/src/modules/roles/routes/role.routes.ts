// apps/api/src/modules/roles/routes/role.routes.ts
import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const roleRoutes: Router = Router();
const controller = new RoleController();

roleRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.ROLES, action: 'read' }]), controller.getAll.bind(controller))
  .post(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.ROLES, action: 'create' }]), controller.create.bind(controller));

roleRoutes.route('/:id')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.ROLES, action: 'read' }]), controller.getById.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.ROLES, action: 'update' }]), controller.update.bind(controller))
  .delete(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.ROLES, action: 'delete' }]), controller.delete.bind(controller));

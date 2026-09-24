// apps/api/src/modules/users/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const userRoutes: Router = Router();
const controller = new UserController();

userRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.USERS, action: 'read' }]), controller.getAll.bind(controller))
  .post(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.USERS, action: 'create' }]), controller.create.bind(controller));

userRoutes.route('/:id')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.USERS, action: 'read' }]), controller.getById.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.USERS, action: 'update' }]), controller.update.bind(controller))
  .delete(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.USERS, action: 'delete' }]), controller.delete.bind(controller));

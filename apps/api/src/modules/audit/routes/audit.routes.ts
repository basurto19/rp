// apps/api/src/modules/audit/routes/audit.routes.ts
import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const auditRoutes: Router = Router();
const controller = new AuditController();

auditRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.AUDIT, action: 'read' }]), controller.getAll.bind(controller));

auditRoutes.route('/module/:module')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.AUDIT, action: 'read' }]), controller.getByModule.bind(controller));

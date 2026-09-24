// apps/api/src/modules/settings/routes/setting.routes.ts
import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticateToken, validateTenant, authorizeRole } from '../../../middleware';
import { MODULES } from '@erp/constants';

export const settingRoutes: Router = Router();
const controller = new SettingController();

settingRoutes.route('/')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.SETTINGS, action: 'read' }]), controller.getAll.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.SETTINGS, action: 'update' }]), controller.upsert.bind(controller));

settingRoutes.route('/:key')
  .get(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.SETTINGS, action: 'read' }]), controller.getByKey.bind(controller))
  .put(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.SETTINGS, action: 'update' }]), controller.upsert.bind(controller))
  .delete(authenticateToken, validateTenant, authorizeRole([{ module: MODULES.SETTINGS, action: 'delete' }]), controller.delete.bind(controller));

// apps/api/src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from '../modules/auth/routes/auth.routes';
import { userRoutes } from '../modules/users/routes/user.routes';
import { companyRoutes } from '../modules/companies/routes/company.routes';
import { branchRoutes } from '../modules/branches/routes/branch.routes';
import { roleRoutes } from '../modules/roles/routes/role.routes';
import { settingRoutes } from '../modules/settings/routes/setting.routes';
import { auditRoutes } from '../modules/audit/routes/audit.routes';
import { productRoutes } from '../modules/products/routes/product.routes';
import { customerRoutes } from '../modules/customers/routes/customer.routes';
import { saleRoutes } from '../modules/sales/routes/sale.routes';
import { supplierRoutes } from '../modules/suppliers/routes/supplier.routes';

export const routes: Router = Router();

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/companies', companyRoutes);
routes.use('/branches', branchRoutes);
routes.use('/roles', roleRoutes);
routes.use('/settings', settingRoutes);
routes.use('/audit', auditRoutes);
routes.use('/products', productRoutes);
routes.use('/customers', customerRoutes);
routes.use('/sales', saleRoutes);
routes.use('/suppliers', supplierRoutes);

routes.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

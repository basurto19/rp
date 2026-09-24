// apps/api/src/modules/auth/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter } from '../../../middleware';

export const authRoutes: Router = Router();
const controller = new AuthController();

authRoutes.post('/login', authLimiter, controller.login.bind(controller));
authRoutes.post('/refresh', authLimiter, controller.refresh.bind(controller));
authRoutes.post('/logout', controller.logout.bind(controller));
authRoutes.post('/logout-all', controller.logoutAll.bind(controller));
authRoutes.post('/forgot-password', controller.forgotPassword.bind(controller));
authRoutes.put('/change-password', controller.changePassword.bind(controller));

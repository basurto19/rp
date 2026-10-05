// apps/api/src/modules/auth/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter, authenticateToken } from '../../../middleware';

export const authRoutes: Router = Router();
const controller = new AuthController();

authRoutes.post('/login', authLimiter, controller.login.bind(controller));
authRoutes.post('/register', authLimiter, controller.register.bind(controller));
authRoutes.post('/refresh', authLimiter, controller.refresh.bind(controller));
authRoutes.post('/logout', authenticateToken, controller.logout.bind(controller));
authRoutes.post('/logout-all', authenticateToken, controller.logoutAll.bind(controller));
authRoutes.post('/forgot-password', controller.forgotPassword.bind(controller));
authRoutes.put('/change-password', authenticateToken, controller.changePassword.bind(controller));

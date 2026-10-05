import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../../shared/responses/response-helper';
import { AppError } from '../../shared/errors/app-error';
import { validateRequestBody } from '../../shared/validators';
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} from '@erp/validation';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  async register(request: Request, response: Response): Promise<Response> {
    const validation = validateRequestBody(registerSchema, request.body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.register(validation.data);
      return successResponse(response, result, 201, result.message);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async verifyEmail(request: Request, response: Response): Promise<Response> {
    const validation = validateRequestBody(verifyEmailSchema, request.body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.verifyEmail(validation.data.token);
      return successResponse(response, result, 200, result.message);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async resendVerification(request: Request, response: Response): Promise<Response> {
    const validation = validateRequestBody(resendVerificationSchema, request.body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.resendVerification(validation.data.email);
      return successResponse(response, result, 200, result.message);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async login(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(loginSchema, body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.login(validation.data.email, validation.data.password);
      return successResponse(response, result, 200, 'Login exitoso');
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async refresh(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(refreshTokenSchema, body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.refreshToken(validation.data.refreshToken);
      return successResponse(response, result);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async logout(request: Request, response: Response): Promise<Response> {
    const { refreshToken } = request.body;
    const userId = (request as any).userId;
    await this.service.logout(refreshToken, userId);
    return successResponse(response, { success: true }, 200, 'Logout exitoso');
  }

  async logoutAll(request: Request, response: Response): Promise<Response> {
    const userId = (request as any).userId;
    await this.service.logoutAll(userId, (request as any).tenantId);
    return successResponse(response, { success: true }, 200, 'Todas las sesiones cerradas');
  }

  async forgotPassword(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(forgotPasswordSchema, body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    try {
      const result = await this.service.forgotPassword(validation.data.email, (request as any).tenantId);
      return successResponse(response, result);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }

  async changePassword(request: Request, response: Response): Promise<Response> {
    const body = request.body;
    const validation = validateRequestBody(changePasswordSchema, body);
    if (!validation.valid) {
      return response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: validation.errors } });
    }

    const userId = (request as any).userId;
    try {
      const result = await this.service.changePassword(userId, validation.data.currentPassword, validation.data.newPassword);
      return successResponse(response, result);
    } catch (err) {
      if (err instanceof AppError) return errorResponse(response, err);
      throw err;
    }
  }
}

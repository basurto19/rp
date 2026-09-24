"use strict";
// apps/api/tests/unit/auth.service.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../src/modules/auth/services/auth.service");
const user_model_1 = require("../../src/modules/users/models/user.model");
const app_error_1 = require("../../src/modules/shared/errors/app-error");
// Mock del modelo User
jest.mock('../../src/modules/users/models/user.model', () => ({
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));
const mockUser = {
    _id: 'test-user-id',
    tenantId: 'test-tenant',
    email: 'test@example.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYy6GP3nXnL9dK3sP1wXqZ7y8rN1m2O3',
    status: 'active',
    roleId: 'seller',
    branchId: null,
    lastLoginAt: null,
};
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
        jest.clearAllMocks();
    });
    describe('login', () => {
        it('debería lanzar error si el usuario no existe', async () => {
            user_model_1.User.findOne.mockResolvedValue(null);
            await expect(authService.login('unknown@test.com', 'password123')).rejects.toThrow(app_error_1.AppError);
        });
        it('debería lanzar error si el usuario está bloqueado', async () => {
            user_model_1.User.findOne.mockResolvedValue({ ...mockUser, status: 'locked' });
            await expect(authService.login('locked@test.com', 'password123')).rejects.toThrow(app_error_1.AppError);
        });
    });
    describe('changePassword', () => {
        it('debería lanzar error si el usuario no existe', async () => {
            user_model_1.User.findById.mockResolvedValue(null);
            await expect(authService.changePassword('unknown-id', 'old', 'new123456')).rejects.toThrow(app_error_1.AppError);
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map
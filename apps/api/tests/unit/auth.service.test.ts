// apps/api/tests/unit/auth.service.test.ts

import { AuthService } from '../../src/modules/auth/services/auth.service';
import { User } from '../../src/modules/users/models/user.model';
import { AppError } from '../../src/modules/shared/errors/app-error';

// Mock del modelo User
jest.mock('../../src/modules/users/models/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
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
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería lanzar error si el usuario no existe', async () => {
      (User.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(authService.login('unknown@test.com', 'password123')).rejects.toThrow(AppError);
    });

    it('debería lanzar error si el usuario está bloqueado', async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, status: 'locked' }),
      });

      await expect(authService.login('locked@test.com', 'password123')).rejects.toThrow(AppError);
    });
  });

  describe('changePassword', () => {
    it('debería lanzar error si el usuario no existe', async () => {
      (User.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(authService.changePassword('unknown-id', 'old', 'new123456')).rejects.toThrow(AppError);
    });
  });
});

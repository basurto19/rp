// apps/api/tests/unit/company.service.test.ts

import { CompanyService } from '../../src/modules/companies/services/company.service';
import { Company } from '../../src/modules/companies/models/company.model';
import { AppError } from '../../src/modules/shared/errors/app-error';

jest.mock('../../src/modules/companies/models/company.model', () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
}));

describe('CompanyService', () => {
  let companyService: CompanyService;

  beforeEach(() => {
    companyService = new CompanyService();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería lanzar error si la empresa ya existe', async () => {
      (Company.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-id' });

      await expect(companyService.create({
        tenantId: 'test-tenant',
        name: 'Test Company',
        ruc: '12345',
        email: 'existing@test.com',
        status: 'active',
        plan: 'free',
      })).rejects.toThrow(AppError);
    });
  });
});

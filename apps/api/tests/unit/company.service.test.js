"use strict";
// apps/api/tests/unit/company.service.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const company_service_1 = require("../../src/modules/companies/services/company.service");
const company_model_1 = require("../../src/modules/companies/models/company.model");
const app_error_1 = require("../../src/modules/shared/errors/app-error");
jest.mock('../../src/modules/companies/models/company.model', () => ({
    findOne: jest.fn(),
    countDocuments: jest.fn(),
}));
describe('CompanyService', () => {
    let companyService;
    beforeEach(() => {
        companyService = new company_service_1.CompanyService();
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('debería lanzar error si la empresa ya existe', async () => {
            company_model_1.Company.findOne.mockResolvedValue({ _id: 'existing-id' });
            await expect(companyService.create({
                tenantId: 'test-tenant',
                name: 'Test Company',
                ruc: '12345',
                email: 'existing@test.com',
                status: 'active',
                plan: 'free',
            })).rejects.toThrow(app_error_1.AppError);
        });
    });
});
//# sourceMappingURL=company.service.test.js.map
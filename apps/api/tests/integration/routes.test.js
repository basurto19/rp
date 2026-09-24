"use strict";
// apps/api/tests/integration/routes.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
describe('API Routes', () => {
    let app;
    beforeAll(() => {
        app = (0, app_1.createApp)();
    });
    describe('Health Check', () => {
        it('GET /health debería retornar éxito', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/health')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('ok');
        });
    });
    describe('404 Handler', () => {
        it('Ruta no existente debería retornar 404', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/nonexistent')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
        });
    });
    describe('Rate Limiting', () => {
        it('GET /api/v1/companies sin auth debería retornar 401', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/companies')
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });
    });
});
//# sourceMappingURL=routes.test.js.map
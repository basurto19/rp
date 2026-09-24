"use strict";
// packages/utils/src/index.ts
// Utilidades compartidas para todo el sistema ERP
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateTenantId = generateTenantId;
exports.generateBranchId = generateBranchId;
exports.formatDate = formatDate;
exports.getCurrentUTCDate = getCurrentUTCDate;
exports.sanitizeString = sanitizeString;
exports.isUuid = isUuid;
exports.buildPaginationOffset = buildPaginationOffset;
function generateId() {
    return crypto.randomUUID();
}
function generateTenantId() {
    return `tenant_${crypto.randomUUID().slice(0, 8)}`;
}
function generateBranchId() {
    return `branch_${crypto.randomUUID().slice(0, 8)}`;
}
function formatDate(date) {
    return date.toISOString();
}
function getCurrentUTCDate() {
    return new Date();
}
function sanitizeString(input) {
    return input.replace(/[<>;"'&]/g, '').trim();
}
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function buildPaginationOffset(page, limit) {
    return (page - 1) * limit;
}
//# sourceMappingURL=index.js.map
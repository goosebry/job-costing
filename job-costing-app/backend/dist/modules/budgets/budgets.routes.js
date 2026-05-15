"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// GET /api/budgets - List budgets
router.get('/', (0, rbac_middleware_1.requirePermission)('budgets:read'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ message: 'Budgets list', organizationId: req.user?.organizationId });
}));
// GET /api/budgets/:id - Get budget by ID
router.get('/:id', (0, rbac_middleware_1.requirePermission)('budgets:read'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ message: 'Budget detail', id: req.params.id });
}));
// POST /api/budgets - Create budget
router.post('/', (0, rbac_middleware_1.requirePermission)('budgets:update'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.status(201).json({ message: 'Budget created', data: req.body });
}));
// PATCH /api/budgets/:id - Update budget
router.patch('/:id', (0, rbac_middleware_1.requirePermission)('budgets:update'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ message: 'Budget updated', id: req.params.id });
}));
// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('budgets:update'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.status(204).send();
}));
// GET /api/budgets/job/:jobId - Get budgets by job
router.get('/job/:jobId', (0, rbac_middleware_1.requirePermission)('budgets:read'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({ message: 'Job budgets', jobId: req.params.jobId });
}));
// GET /api/budgets/variance/:jobId - Get budget variance for job
router.get('/variance/:jobId', (0, rbac_middleware_1.requirePermission)('budgets:read'), (0, error_middleware_1.asyncHandler)(async (req, res) => {
    res.json({
        message: 'Budget variance',
        jobId: req.params.jobId,
        estimated: 0,
        actual: 0,
        variance: 0,
        variancePercentage: 0
    });
}));
exports.default = router;
//# sourceMappingURL=budgets.routes.js.map
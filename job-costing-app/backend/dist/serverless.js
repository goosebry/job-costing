"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Serverless-safe Express app entry point.
 * No Socket.IO, no process signal handlers — safe for Vercel functions.
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const jobs_routes_1 = __importDefault(require("./modules/jobs/jobs.routes"));
const costs_routes_1 = __importDefault(require("./modules/costs/costs.routes"));
const labor_routes_1 = __importDefault(require("./modules/labor/labor.routes"));
const budgets_routes_1 = __importDefault(require("./modules/budgets/budgets.routes"));
const change_orders_routes_1 = __importDefault(require("./modules/change-orders/change-orders.routes"));
const invoices_routes_1 = __importDefault(require("./modules/invoices/invoices.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const onboarding_routes_1 = __importDefault(require("./modules/onboarding/onboarding.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, /\.vercel\.app$/, 'http://localhost:5173']
    : '*';
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobs', jobs_routes_1.default);
app.use('/api/costs', costs_routes_1.default);
app.use('/api/labor', labor_routes_1.default);
app.use('/api/budget', budgets_routes_1.default);
app.use('/api/change-orders', change_orders_routes_1.default);
app.use('/api/invoices', invoices_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/onboarding', onboarding_routes_1.default);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=serverless.js.map
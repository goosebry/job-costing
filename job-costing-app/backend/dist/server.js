"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const jobs_routes_1 = __importDefault(require("./modules/jobs/jobs.routes"));
const costs_routes_1 = __importDefault(require("./modules/costs/costs.routes"));
const labor_routes_1 = __importDefault(require("./modules/labor/labor.routes"));
const budgets_routes_1 = __importDefault(require("./modules/budgets/budgets.routes"));
const change_orders_routes_1 = __importDefault(require("./modules/change-orders/change-orders.routes"));
const invoices_routes_1 = __importDefault(require("./modules/invoices/invoices.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const stripe_routes_1 = __importDefault(require("./modules/stripe/stripe.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const notifications_socket_1 = require("./modules/notifications/notifications.socket");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/jobs', jobs_routes_1.default);
app.use('/api/costs', costs_routes_1.default);
app.use('/api/labor', labor_routes_1.default);
app.use('/api/budget', budgets_routes_1.default);
app.use('/api/change-orders', change_orders_routes_1.default);
app.use('/api/invoices', invoices_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
app.use('/api/stripe', stripe_routes_1.default);
// Demo routes for when database is not available
app.get('/api/demos/jobs', (_req, res) => {
    res.json([
        { id: '1', name: 'Office Renovation', status: 'IN_PROGRESS', clientName: 'Acme Corp' },
        { id: '2', name: 'Warehouse Expansion', status: 'PLANNING', clientName: 'BuildCo' },
    ]);
});
app.get('/api/demos/notifications', (_req, res) => {
    res.json([
        { id: '1', type: 'INFO', title: 'Welcome', message: 'Welcome to Job Costing App', read: false, createdAt: new Date().toISOString() },
    ]);
});
app.use(error_middleware_1.errorHandler);
(0, notifications_socket_1.setupNotifications)(exports.io);
const gracefulShutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    exports.io.close(() => {
        console.log('[Server] Socket.IO closed');
        httpServer.close(() => {
            console.log('[Server] HTTP server closed');
            process.exit(0);
        });
    });
    setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=server.js.map
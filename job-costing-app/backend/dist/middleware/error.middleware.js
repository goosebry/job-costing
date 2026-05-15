"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
class AppError extends Error {
    statusCode;
    isOperational;
    requestId;
    constructor(message, statusCode, requestId) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.requestId = requestId;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    const requestId = req.headers['x-request-id'] || generateRequestId();
    console.error(`[Error] [${requestId}]`, err);
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'Request validation failed',
            requestId,
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            res.status(409).json({
                error: 'Conflict',
                message: 'A record with this value already exists',
                requestId,
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found',
                requestId,
            });
            return;
        }
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
            requestId,
        });
        return;
    }
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        requestId,
    });
};
exports.errorHandler = errorHandler;
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map
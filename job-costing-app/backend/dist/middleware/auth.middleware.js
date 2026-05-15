"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = exports.authMiddleware = void 0;
const auth_1 = require("../config/auth");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, auth_1.verify)(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
exports.authenticate = exports.authMiddleware;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, auth_1.verify)(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
        req.user = decoded;
    }
    catch {
        // Ignore invalid tokens for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map
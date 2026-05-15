"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const login_schema_1 = require("./dto/login.schema");
const register_schema_1 = require("./dto/register.schema");
class AuthController {
    async register(req, res) {
        const validatedData = register_schema_1.registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register(validatedData);
        res.status(201).json(result);
    }
    async login(req, res) {
        const validatedData = login_schema_1.loginSchema.parse(req.body);
        const result = await auth_service_1.authService.login(validatedData);
        res.json(result);
    }
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        const tokens = await auth_service_1.authService.refreshToken(refreshToken);
        res.json(tokens);
    }
    async logout(req, res) {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await auth_service_1.authService.logout(refreshToken);
        }
        res.json({ message: 'Logged out successfully' });
    }
    async getProfile(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const profile = await auth_service_1.authService.getProfile(req.user.userId);
        res.json(profile);
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map
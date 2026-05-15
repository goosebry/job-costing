"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const auth_1 = require("../../config/auth");
const error_middleware_1 = require("../../middleware/error.middleware");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
class AuthService {
    async register(data) {
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new error_middleware_1.AppError('User with this email already exists', 409);
        }
        const passwordHash = await (0, auth_1.hash)(data.password);
        const organization = await database_1.default.organization.create({
            data: {
                name: data.organizationName,
                users: {
                    create: {
                        email: data.email,
                        passwordHash,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        role: data.role || client_1.OrganizationUserRole.ADMIN,
                    },
                },
            },
            include: {
                users: true,
            },
        });
        const user = organization.users[0];
        const tokens = (0, auth_1.generateTokens)(user.id, user.role, organization.id);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organization: {
                    id: organization.id,
                    name: organization.name,
                },
            },
            ...tokens,
        };
    }
    async login(data) {
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
            include: { organization: true },
        });
        if (!user || !user.isActive) {
            throw new error_middleware_1.AppError('Invalid credentials', 401);
        }
        const isPasswordValid = await (0, auth_1.compare)(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Invalid credentials', 401);
        }
        await database_1.default.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const tokens = (0, auth_1.generateTokens)(user.id, user.role, user.organizationId);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organization: {
                    id: user.organization.id,
                    name: user.organization.name,
                },
            },
            ...tokens,
        };
    }
    async refreshToken(refreshToken) {
        const tokenRecord = await database_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord) {
            throw new error_middleware_1.AppError('Invalid refresh token', 401);
        }
        if (tokenRecord.expiresAt < new Date()) {
            await database_1.default.refreshToken.delete({
                where: { id: tokenRecord.id },
            });
            throw new error_middleware_1.AppError('Refresh token expired', 401);
        }
        const tokens = (0, auth_1.generateTokens)(tokenRecord.user.id, tokenRecord.user.role, tokenRecord.user.organizationId);
        await database_1.default.refreshToken.delete({
            where: { id: tokenRecord.id },
        });
        await this.saveRefreshToken(tokenRecord.user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(refreshToken) {
        await database_1.default.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    async getProfile(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        domain: true,
                        stripeCustomerId: true,
                    },
                },
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLogin: user.lastLogin,
            organization: user.organization,
        };
    }
    async saveRefreshToken(userId, token) {
        const expiresAt = (0, date_fns_1.addDays)(new Date(), 7);
        await database_1.default.refreshToken.create({
            data: { token, userId, expiresAt },
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map
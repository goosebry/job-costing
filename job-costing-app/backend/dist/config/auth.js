"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALT_ROUNDS = exports.REFRESH_TOKEN_EXPIRY = exports.ACCESS_TOKEN_EXPIRY = void 0;
exports.sign = sign;
exports.verify = verify;
exports.hash = hash;
exports.compare = compare;
exports.generateTokens = generateTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ACCESS_TOKEN_EXPIRY = '24h';
exports.ACCESS_TOKEN_EXPIRY = ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = '7d';
exports.REFRESH_TOKEN_EXPIRY = REFRESH_TOKEN_EXPIRY;
const SALT_ROUNDS = 12;
exports.SALT_ROUNDS = SALT_ROUNDS;
function sign(payload, secret, options) {
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY, ...options });
}
function verify(token, secret) {
    return jsonwebtoken_1.default.verify(token, secret);
}
async function hash(data) {
    return bcryptjs_1.default.hash(data, SALT_ROUNDS);
}
async function compare(data, encrypted) {
    return bcryptjs_1.default.compare(data, encrypted);
}
function generateTokens(userId, role, organizationId) {
    const payload = { userId, role, organizationId };
    const accessToken = sign(payload, process.env.JWT_SECRET || 'default-secret-change-in-production', {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET || 'default-secret-change-in-production', { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
}
//# sourceMappingURL=auth.js.map
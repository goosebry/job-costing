"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.testConnection = testConnection;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
async function testConnection(maxRetries = 5, delayMs = 2000) {
    // Skip actual database connection if DATABASE_URL is not set
    if (!process.env.DATABASE_URL) {
        console.log('[DB] DATABASE_URL not set - skipping database connection');
        console.log('[DB] Running in demo mode without persistent storage');
        return true;
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
            console.log(`[DB] Connection established (attempt ${attempt})`);
            return true;
        }
        catch (error) {
            console.error(`[DB] Connection attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw new Error('Database connection failed after maximum retries');
}
exports.default = exports.prisma;
//# sourceMappingURL=database.js.map
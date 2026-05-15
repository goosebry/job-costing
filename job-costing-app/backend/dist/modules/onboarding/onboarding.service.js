"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingService = exports.OnboardingService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const database_1 = __importDefault(require("../../../config/database"));
const auth_1 = require("../../../config/auth");
const error_middleware_1 = require("../../../middleware/error.middleware");
// ─── Gemini AI helper ─────────────────────────────────────────────────────────
async function generateDemoData(businessType, businessName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new error_middleware_1.AppError('AI onboarding unavailable: GEMINI_API_KEY not set', 503);
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
    const prompt = `You are generating realistic demo data for a job costing application.
Business: "${businessName}" — Industry: "${businessType}"

Return ONLY a JSON object (no markdown) with this exact structure:
{
  "costCategories": [
    { "name": "string", "unitType": "each|hour|m2|kg|litre|day" }
  ],
  "clients": [
    { "name": "string", "email": "string", "phone": "string", "address": "string" }
  ],
  "jobs": [
    {
      "name": "string",
      "clientIndex": 0,
      "status": "ACTIVE|IN_PROGRESS|COMPLETED|PLANNING",
      "estimatedBudget": 0,
      "description": "string",
      "costs": [
        { "categoryIndex": 0, "description": "string", "quantity": 1, "unitCost": 100, "vendor": "string" }
      ]
    }
  ]
}

Rules:
- 5-8 costCategories relevant to ${businessType}
- 4-5 clients with realistic ${businessType} company names
- 5-7 jobs spread across statuses, referencing clientIndex and categoryIndex
- Costs should be realistic for ${businessType}
- All monetary values in NZD`;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    });
    const text = result.response.text();
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
}
// ─── Service ──────────────────────────────────────────────────────────────────
class OnboardingService {
    async setupDemo(organizationId, businessType, businessName, _password) {
        const org = await database_1.default.organization.findUnique({ where: { id: organizationId } });
        if (!org)
            throw new error_middleware_1.AppError('Organization not found', 404);
        // Clear any existing transactional data first
        await this._clearTransactionalData(organizationId);
        // Get the admin user for seeding
        const adminUser = await database_1.default.user.findFirst({ where: { organizationId, role: 'ADMIN' } });
        if (!adminUser)
            throw new error_middleware_1.AppError('Admin user not found', 404);
        // Generate AI demo data
        const demo = await generateDemoData(businessType, businessName);
        // 1. Create cost categories
        const categories = await Promise.all(demo.costCategories.map((c) => database_1.default.costCategory.upsert({
            where: { organizationId_name: { organizationId, name: c.name } },
            create: { organizationId, name: c.name, unitType: c.unitType },
            update: {},
        })));
        // 2. Create clients
        const clients = await Promise.all(demo.clients.map((c) => database_1.default.client.create({
            data: {
                organizationId,
                name: c.name,
                email: c.email,
                phone: c.phone,
                address: { street: c.address },
            },
        })));
        // 3. Create jobs with costs
        let jobCounter = 1;
        for (const j of demo.jobs) {
            const client = clients[j.clientIndex] || clients[0];
            const job = await database_1.default.job.create({
                data: {
                    organizationId,
                    createdById: adminUser.id,
                    jobNumber: `DEMO-${String(jobCounter++).padStart(3, '0')}`,
                    name: j.name,
                    description: j.description,
                    clientId: client.id,
                    clientName: client.name,
                    status: j.status,
                    estimatedBudget: j.estimatedBudget,
                    startDate: new Date(),
                },
            });
            // Create costs for this job
            for (const cost of j.costs || []) {
                const category = categories[cost.categoryIndex] || categories[0];
                await database_1.default.jobCost.create({
                    data: {
                        jobId: job.id,
                        createdById: adminUser.id,
                        categoryId: category.id,
                        description: cost.description,
                        quantity: cost.quantity,
                        unitCost: cost.unitCost,
                        totalCost: cost.quantity * cost.unitCost,
                        vendor: cost.vendor,
                        date: new Date(),
                        isBillable: true,
                    },
                });
            }
        }
        // Mark org as demo mode
        await database_1.default.organization.update({
            where: { id: organizationId },
            data: { metadata: { ...(org.metadata || {}), mode: 'demo', businessType, businessName } },
        });
        return { success: true, message: 'Demo data created successfully', mode: 'demo' };
    }
    async goLive(organizationId, userId, password) {
        await this._verifyPassword(userId, password);
        await this._clearTransactionalData(organizationId);
        const org = await database_1.default.organization.findUnique({ where: { id: organizationId } });
        await database_1.default.organization.update({
            where: { id: organizationId },
            data: { metadata: { ...(org?.metadata || {}), mode: 'live' } },
        });
        return { success: true, message: 'Switched to live mode — demo data cleared', mode: 'live' };
    }
    async clearData(organizationId, userId, password) {
        await this._verifyPassword(userId, password);
        await this._clearTransactionalData(organizationId);
        return { success: true, message: 'All data cleared — templates retained' };
    }
    async redoSetup(organizationId, userId, password) {
        await this._verifyPassword(userId, password);
        await this._clearTransactionalData(organizationId);
        const org = await database_1.default.organization.findUnique({ where: { id: organizationId } });
        await database_1.default.organization.update({
            where: { id: organizationId },
            data: { metadata: { ...(org?.metadata || {}), mode: 'setup', setupComplete: false } },
        });
        return { success: true, message: 'Setup reset — you can run onboarding again' };
    }
    async getStatus(organizationId) {
        const org = await database_1.default.organization.findUnique({ where: { id: organizationId } });
        const meta = org?.metadata || {};
        return {
            mode: meta.mode || 'live',
            setupComplete: meta.setupComplete || false,
            businessType: meta.businessType,
            businessName: meta.businessName,
        };
    }
    // ─── Helpers ───────────────────────────────────────────────────────────────
    async _verifyPassword(userId, password) {
        const user = await database_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new error_middleware_1.AppError('User not found', 404);
        const valid = await (0, auth_1.compare)(password, user.passwordHash);
        if (!valid)
            throw new error_middleware_1.AppError('Invalid password', 401);
    }
    async _clearTransactionalData(organizationId) {
        // Get all job IDs for this org
        const jobs = await database_1.default.job.findMany({ where: { organizationId }, select: { id: true } });
        const jobIds = jobs.map((j) => j.id);
        // Delete in dependency order
        if (jobIds.length > 0) {
            await database_1.default.jobCost.deleteMany({ where: { jobId: { in: jobIds } } });
            await database_1.default.jobLabor.deleteMany({ where: { jobId: { in: jobIds } } });
            await database_1.default.changeOrder.deleteMany({ where: { jobId: { in: jobIds } } });
            await database_1.default.invoice.deleteMany({ where: { jobId: { in: jobIds } } });
        }
        await database_1.default.job.deleteMany({ where: { organizationId } });
        await database_1.default.client.deleteMany({ where: { organizationId } });
        await database_1.default.notification.deleteMany({ where: { user: { organizationId } } });
    }
}
exports.OnboardingService = OnboardingService;
exports.onboardingService = new OnboardingService();
//# sourceMappingURL=onboarding.service.js.map
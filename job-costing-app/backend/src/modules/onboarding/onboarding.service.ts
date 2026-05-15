import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/database';
import { compare } from '../../config/auth';
import { AppError } from '../../middleware/error.middleware';

// ─── Gemini AI helper ─────────────────────────────────────────────────────────
async function generateDemoData(businessType: string, businessName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError('AI onboarding unavailable: GEMINI_API_KEY not set', 503);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Generate demo data for a ${businessType} business called "${businessName}".
Return ONLY valid JSON, no markdown, no comments, no trailing commas. Use exactly this structure with exactly these counts:
{
  "costCategories": [
    {"name":"Labour","unitType":"hour"},
    {"name":"Materials","unitType":"each"},
    {"name":"Equipment","unitType":"day"},
    {"name":"Subcontractors","unitType":"each"}
  ],
  "clients": [
    {"name":"Client A Pty Ltd","email":"contact@clienta.com","phone":"021 111 1111","address":"1 Main St, Auckland"},
    {"name":"Client B Ltd","email":"info@clientb.com","phone":"021 222 2222","address":"2 High St, Wellington"}
  ],
  "jobs": [
    {"name":"Job Name 1","clientIndex":0,"status":"ACTIVE","estimatedBudget":15000,"description":"Job description","costs":[{"categoryIndex":0,"description":"Labour cost","quantity":20,"unitCost":85,"vendor":"Internal"}]},
    {"name":"Job Name 2","clientIndex":1,"status":"COMPLETED","estimatedBudget":8000,"description":"Job description","costs":[{"categoryIndex":1,"description":"Materials","quantity":10,"unitCost":120,"vendor":"Supplier NZ"}]},
    {"name":"Job Name 3","clientIndex":0,"status":"PLANNING","estimatedBudget":25000,"description":"Job description","costs":[{"categoryIndex":2,"description":"Equipment hire","quantity":5,"unitCost":200,"vendor":"Hire Co"}]}
  ]
}

Replace placeholder values with realistic ${businessType} industry data. Keep exact structure. Return only the JSON object.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
  });

  const text = result.response.text();
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) clean = jsonMatch[0];
  clean = clean.replace(/\/\/[^\n]*/g, '').replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(clean);
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class OnboardingService {
  async setupDemo(organizationId: string, businessType: string, businessName: string, _password: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Organization not found', 404);

    // Clear any existing transactional data first
    await this._clearTransactionalData(organizationId);

    // Get the admin user for seeding
    const adminUser = await prisma.user.findFirst({ where: { organizationId, role: 'ADMIN' } });
    if (!adminUser) throw new AppError('Admin user not found', 404);

    // Generate AI demo data
    const demo = await generateDemoData(businessType, businessName);

    // 1. Create cost categories
    const categories = await Promise.all(
      demo.costCategories.map((c: any) =>
        prisma.costCategory.upsert({
          where: { organizationId_name: { organizationId, name: c.name } },
          create: { organizationId, name: c.name, unitType: c.unitType },
          update: {},
        })
      )
    );

    // 2. Create clients
    const clients = await Promise.all(
      demo.clients.map((c: any) =>
        prisma.client.create({
          data: {
            organizationId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: { street: c.address },
          },
        })
      )
    );

    // 3. Create jobs with costs
    let jobCounter = 1;
    for (const j of demo.jobs) {
      const client = clients[j.clientIndex] || clients[0];
      const job = await prisma.job.create({
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
        await prisma.jobCost.create({
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
    await prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: { ...(org.metadata as any || {}), mode: 'demo', businessType, businessName } },
    });

    return { success: true, message: 'Demo data created successfully', mode: 'demo' };
  }

  async goLive(organizationId: string, userId: string, password: string) {
    await this._verifyPassword(userId, password);
    await this._clearTransactionalData(organizationId);

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    await prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: { ...(org?.metadata as any || {}), mode: 'live' } },
    });

    return { success: true, message: 'Switched to live mode — demo data cleared', mode: 'live' };
  }

  async clearData(organizationId: string, userId: string, password: string) {
    await this._verifyPassword(userId, password);
    await this._clearTransactionalData(organizationId);
    return { success: true, message: 'All data cleared — templates retained' };
  }

  async redoSetup(organizationId: string, userId: string, password: string) {
    await this._verifyPassword(userId, password);
    await this._clearTransactionalData(organizationId);

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    await prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: { ...(org?.metadata as any || {}), mode: 'setup', setupComplete: false } },
    });

    return { success: true, message: 'Setup reset — you can run onboarding again' };
  }

  async getStatus(organizationId: string) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const meta = (org?.metadata as any) || {};
    return {
      mode: meta.mode || 'live',
      setupComplete: meta.setupComplete || false,
      businessType: meta.businessType,
      businessName: meta.businessName,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private async _verifyPassword(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    const valid = await compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid password', 401);
  }

  private async _clearTransactionalData(organizationId: string) {
    // Get all job IDs for this org
    const jobs = await prisma.job.findMany({ where: { organizationId }, select: { id: true } });
    const jobIds = jobs.map((j) => j.id);

    // Delete in dependency order
    if (jobIds.length > 0) {
      await prisma.jobCost.deleteMany({ where: { jobId: { in: jobIds } } });
      await prisma.jobLabor.deleteMany({ where: { jobId: { in: jobIds } } });
      await prisma.changeOrder.deleteMany({ where: { jobId: { in: jobIds } } });
      await prisma.invoice.deleteMany({ where: { jobId: { in: jobIds } } });
    }
    await prisma.job.deleteMany({ where: { organizationId } });
    await prisma.client.deleteMany({ where: { organizationId } });
    await prisma.notification.deleteMany({ where: { user: { organizationId } } });
  }
}

export const onboardingService = new OnboardingService();

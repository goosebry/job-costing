import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/database';
import { compare } from '../../config/auth';
import { AppError } from '../../middleware/error.middleware';

// ─── Default fallback data ────────────────────────────────────────────────────
function getDefaultDemoData(businessType: string, businessName: string) {
  const type = businessType;
  return {
    costCategories: [
      { name: 'Labour', unitType: 'hour' },
      { name: 'Materials', unitType: 'each' },
      { name: 'Equipment Hire', unitType: 'day' },
      { name: 'Subcontractors', unitType: 'each' },
      { name: 'Travel & Expenses', unitType: 'each' },
    ],
    clients: [
      { name: `${businessName} Client A`, email: 'client.a@example.com', phone: '021 100 0001', address: '1 Main Street, Auckland' },
      { name: `${businessName} Client B`, email: 'client.b@example.com', phone: '021 100 0002', address: '2 High Street, Wellington' },
      { name: `${businessName} Client C`, email: 'client.c@example.com', phone: '021 100 0003', address: '3 Queen Street, Christchurch' },
    ],
    jobs: [
      {
        name: `${type} Installation – Site A`, clientIndex: 0, status: 'ACTIVE', estimatedBudget: 18000,
        description: `${type} installation and commissioning at client site`,
        costs: [
          { categoryIndex: 0, description: `${type} labour`, quantity: 40, unitCost: 85, vendor: 'Internal Team' },
          { categoryIndex: 1, description: 'Parts & materials', quantity: 1, unitCost: 3200, vendor: 'Trade Supplies NZ' },
        ],
      },
      {
        name: `${type} Maintenance – Site B`, clientIndex: 1, status: 'COMPLETED', estimatedBudget: 6500,
        description: `Routine ${type.toLowerCase()} maintenance and inspection`,
        costs: [
          { categoryIndex: 0, description: 'Maintenance labour', quantity: 16, unitCost: 85, vendor: 'Internal Team' },
          { categoryIndex: 2, description: 'Equipment hire', quantity: 2, unitCost: 350, vendor: 'Hire NZ Ltd' },
        ],
      },
      {
        name: `${type} Upgrade – Site C`, clientIndex: 2, status: 'PLANNING', estimatedBudget: 32000,
        description: `Full ${type.toLowerCase()} system upgrade and compliance check`,
        costs: [
          { categoryIndex: 3, description: 'Specialist subcontractor', quantity: 1, unitCost: 8000, vendor: 'Specialist Co' },
          { categoryIndex: 1, description: 'Upgrade materials', quantity: 1, unitCost: 5500, vendor: 'Trade Supplies NZ' },
        ],
      },
    ],
  };
}

// ─── Gemini AI personalisation ────────────────────────────────────────────────
async function generateDemoData(businessType: string, businessName: string) {
  const fallback = getDefaultDemoData(businessType, businessName);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a data generator for a job costing platform. A business called "${businessName}" in the "${businessType}" industry needs realistic demo data.

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "costCategories": [{ "name": "string", "unitType": "hour|each|day|meter|kg" }],
  "clients": [{ "name": "string", "email": "string", "phone": "string", "address": "string" }],
  "jobs": [{
    "name": "string", "clientIndex": 0, "status": "ACTIVE|COMPLETED|PLANNING",
    "estimatedBudget": number, "description": "string",
    "costs": [{ "categoryIndex": 0, "description": "string", "quantity": number, "unitCost": number, "vendor": "string" }]
  }]
}

Rules:
- 5 cost categories relevant to ${businessType}
- 3 NZ-based clients with realistic names and NZ addresses
- 3 jobs (1 ACTIVE, 1 COMPLETED, 1 PLANNING) with 2 cost entries each
- Use realistic NZ dollar amounts and NZ phone numbers (021/022/027)
- categoryIndex references the costCategories array index
- clientIndex references the clients array index`;

    // 30s timeout to stay well within Vercel's 60s limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });
    clearTimeout(timeout);

    const text = result.response.text().trim();
    // Strip markdown fences if present
    const jsonStr = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validate structure has required fields
    if (!parsed.costCategories?.length || !parsed.clients?.length || !parsed.jobs?.length) {
      console.warn('Gemini returned incomplete structure, using fallback');
      return fallback;
    }

    return parsed;
  } catch (err: any) {
    console.warn('Gemini demo generation failed, using fallback:', err.message);
    return fallback;
  }
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

    // 3. Create jobs with costs, labor, invoices, and change orders
    let jobCounter = 1;
    let invoiceCounter = 1;
    const createdJobs: any[] = [];

    for (const j of demo.jobs) {
      const client = clients[j.clientIndex] || clients[0];
      const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

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
          startDate: daysAgo(30),
          startedAt: j.status !== 'PLANNING' ? daysAgo(25) : undefined,
          completedAt: j.status === 'COMPLETED' ? daysAgo(2) : undefined,
        },
      });
      createdJobs.push(job);

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
            date: daysAgo(Math.floor(Math.random() * 20) + 1),
            isBillable: true,
          },
        });
      }

      // Create labor entries for this job
      const workers = ['Mike Thompson', 'Sarah Chen', 'Jake Williams'];
      for (let i = 0; i < 2; i++) {
        const hours = 6 + Math.floor(Math.random() * 6);
        const rate = 75 + Math.floor(Math.random() * 30);
        await prisma.jobLabor.create({
          data: {
            jobId: job.id,
            createdById: adminUser.id,
            workerName: workers[i % workers.length],
            date: daysAgo(Math.floor(Math.random() * 14) + 1),
            hoursWorked: hours,
            hoursTravel: 0.5 + Math.random(),
            hourlyRate: rate,
            totalCost: hours * rate,
            description: `${businessType} work — day ${i + 1}`,
          },
        });
      }
    }

    // Create invoices (1 SENT, 1 PAID)
    if (createdJobs.length >= 2) {
      await prisma.invoice.create({
        data: {
          jobId: createdJobs[0].id,
          invoiceNumber: `INV-${String(invoiceCounter++).padStart(4, '0')}`,
          subtotal: 8500,
          tax: 1275,
          taxRate: 0.15,
          taxLabel: 'GST',
          total: 9775,
          status: 'SENT',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 86400000),
        },
      });

      await prisma.invoice.create({
        data: {
          jobId: createdJobs[1].id,
          invoiceNumber: `INV-${String(invoiceCounter++).padStart(4, '0')}`,
          subtotal: 5800,
          tax: 870,
          taxRate: 0.15,
          taxLabel: 'GST',
          total: 6670,
          status: 'PAID',
          issueDate: new Date(Date.now() - 7 * 86400000),
          dueDate: new Date(Date.now() + 7 * 86400000),
          paidAt: new Date(Date.now() - 2 * 86400000),
        },
      });
    }

    // Create a pending change order
    if (createdJobs.length >= 1) {
      await prisma.changeOrder.create({
        data: {
          jobId: createdJobs[0].id,
          orderNumber: 'CO-001',
          description: 'Additional scope — extra site preparation required',
          amount: 2500,
          status: 'PENDING',
          isCommitted: true,
        },
      });
    }

    // Mark org as demo mode with setup complete
    await prisma.organization.update({
      where: { id: organizationId },
      data: { metadata: { ...(org.metadata as any || {}), mode: 'demo', setupComplete: true, businessType, businessName } },
    });

    return {
      success: true,
      mode: 'demo',
      setup: {
        welcomeMessage: `Welcome to ${businessName}! Your ${businessType} workspace is ready with demo data.`,
        settings: { defaultLaborRate: 85, invoicePrefix: 'INV', taxLabel: 'GST', currency: 'NZD' },
      },
      created: { templates: demo.jobs.length, categories: categories.length },
      jobTemplates: demo.jobs.map((j: any) => ({ name: j.name, description: j.description })),
      costCategories: categories.map((c: any) => ({ name: c.name })),
    };
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

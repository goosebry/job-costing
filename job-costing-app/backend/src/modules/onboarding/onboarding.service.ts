import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/database';
import { compare } from '../../config/auth';
import { AppError } from '../../middleware/error.middleware';

// ─── Gemini AI helper ─────────────────────────────────────────────────────────
async function generateDemoData(businessType: string, businessName: string) {
  // Hardcoded reliable structure — Gemini is used to personalize labels only
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
        name: `${type} Installation – Site A`,
        clientIndex: 0,
        status: 'ACTIVE',
        estimatedBudget: 18000,
        description: `${type} installation and commissioning at client site`,
        costs: [
          { categoryIndex: 0, description: `${type} labour`, quantity: 40, unitCost: 85, vendor: 'Internal Team' },
          { categoryIndex: 1, description: 'Parts & materials', quantity: 1, unitCost: 3200, vendor: 'Trade Supplies NZ' },
        ],
      },
      {
        name: `${type} Maintenance – Site B`,
        clientIndex: 1,
        status: 'COMPLETED',
        estimatedBudget: 6500,
        description: `Routine ${type.toLowerCase()} maintenance and inspection`,
        costs: [
          { categoryIndex: 0, description: 'Maintenance labour', quantity: 16, unitCost: 85, vendor: 'Internal Team' },
          { categoryIndex: 2, description: 'Equipment hire', quantity: 2, unitCost: 350, vendor: 'Hire NZ Ltd' },
        ],
      },
      {
        name: `${type} Upgrade – Site C`,
        clientIndex: 2,
        status: 'PLANNING',
        estimatedBudget: 32000,
        description: `Full ${type.toLowerCase()} system upgrade and compliance check`,
        costs: [
          { categoryIndex: 3, description: 'Specialist subcontractor', quantity: 1, unitCost: 8000, vendor: 'Specialist Co' },
          { categoryIndex: 1, description: 'Upgrade materials', quantity: 1, unitCost: 5500, vendor: 'Trade Supplies NZ' },
        ],
      },
    ],
  };
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

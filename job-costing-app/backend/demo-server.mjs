// Demo server for job costing app - ES Module version
import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file — works in ES modules, no dotenv package needed
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
  console.log('[Server] .env loaded');
} catch {
  console.log('[Server] No .env file — using environment variables');
}

// Generate a JWT-shaped token that can be decoded by the frontend's decodeToken()
function makeDemoJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('demo-sig').toString('base64url');
  return `${header}.${body}.${sig}`;
}

const app = express();
const server = http.createServer(app);

// CORS — open in dev, restricted to the deployed frontend in production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,           // set via render.yaml fromService
      /\.onrender\.com$/,                  // fallback for any *.onrender.com domain
      'http://localhost:5173',             // allow local dev against prod API
    ].filter(Boolean)
  : true; // allow all in development

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Helper function to validate date is within ±90 days past, 30 days future
function isValidDateRange(dateStr) {
  if (!dateStr) return true; // date is optional
  const date = new Date(dateStr);
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() - 90);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + 30);
  return date >= minDate && date <= maxDate;
}

// ─── Seed data factories ──────────────────────────────────────────────────────
// These are the canonical "rich demo" snapshots. They are cloned when the server
// starts and when a user resets to demo mode. The live-mode reset uses only the
// template/category subsets.

const SEED_CLIENTS = [
  { id: 'c1', name: 'Hartley Homes', contactName: 'Rachel Hartley', email: 'rachel@hartleyhomes.co.nz', phone: '09 421 8800', address: '14 Remuera Rd, Auckland 1050', notes: 'Premium residential builder. Net-30 terms. Prefers email invoices.', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'c2', name: 'Pacific Build Group', contactName: 'Tom Nguyen', email: 'tom@pacificbuild.co.nz', phone: '09 307 5500', address: '3 Quay St, Auckland CBD', notes: 'Large commercial developer. Requires purchase orders before work starts.', createdAt: '2024-01-10T00:00:00Z' },
  { id: 'c3', name: 'Clearwater Hospitality', contactName: 'Anna Diaz', email: 'anna@clearwaterhotels.com', phone: '09 913 2200', address: '55 Victoria St, Hamilton', notes: 'Hotel group — multiple sites. Contact Anna for all approvals.', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'c4', name: 'Meridian Retail Ltd', contactName: 'James Okafor', email: 'james@meridianretail.co.nz', phone: '04 499 1100', address: '22 Lambton Quay, Wellington', notes: 'Retail chain, 6 stores. Invoices go to accounts@meridianretail.co.nz', createdAt: '2024-02-15T00:00:00Z' },
  { id: 'c5', name: 'Summit Industrial', contactName: 'Bruce Tanner', email: 'bruce@summitind.co.nz', phone: '03 366 8800', address: '10 Waterloo Rd, Christchurch', notes: '', createdAt: '2024-03-01T00:00:00Z' },
];

const SEED_JOB_TEMPLATES = [
  { id: 't1', name: 'Residential Full Rewire', description: 'Complete rewire of residential property including all circuits, switchboard, and compliance testing.', estimatedBudget: 18000, isTemplate: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 't2', name: 'Switchboard Upgrade', description: 'Replace or upgrade main switchboard to current standards with RCDs and labelling.', estimatedBudget: 4500, isTemplate: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 't3', name: 'New Power Point Installation', description: 'Installation of additional power outlets in residential or light commercial setting.', estimatedBudget: 800, isTemplate: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 't4', name: 'LED Lighting Upgrade', description: 'Replace existing fixtures with LED equivalents, including drivers and fittings.', estimatedBudget: 2200, isTemplate: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 't5', name: 'EV Charger Installation', description: 'Supply and install dedicated EV charging station including line run and circuit protection.', estimatedBudget: 2800, isTemplate: true, createdAt: '2024-01-01T00:00:00Z' },
];

const SEED_JOBS = [
  { id: 'j1', name: 'Hartley St Residence — Full Rewire', status: 'COMPLETED', clientId: 'c1', clientName: 'Hartley Homes', estimatedBudget: 22000, jobNumber: 'JOB-001', createdAt: '2024-01-15T00:00:00Z', startedAt: '2024-01-20T00:00:00Z', completedAt: '2024-02-28T00:00:00Z', estimatedHours: 80 },
  { id: 'j2', name: 'Pacific Build — Commercial Fit-out Electrical', status: 'IN_PROGRESS', clientId: 'c2', clientName: 'Pacific Build Group', estimatedBudget: 85000, jobNumber: 'JOB-002', createdAt: '2024-02-01T00:00:00Z', startedAt: '2024-02-10T00:00:00Z', estimatedHours: 320 },
  { id: 'j3', name: 'Clearwater Hotel — Lighting Upgrade', status: 'IN_PROGRESS', clientId: 'c3', clientName: 'Clearwater Hospitality', estimatedBudget: 18500, jobNumber: 'JOB-003', createdAt: '2024-02-20T00:00:00Z', startedAt: '2024-03-01T00:00:00Z', estimatedHours: 60 },
  { id: 'j4', name: 'Meridian Store #3 — Switchboard Upgrade', status: 'PLANNING', clientId: 'c4', clientName: 'Meridian Retail Ltd', estimatedBudget: 9500, jobNumber: 'JOB-004', createdAt: '2024-03-05T00:00:00Z', estimatedHours: 32 },
  { id: 'j5', name: 'Summit Industrial — EV Charging Station x4', status: 'DRAFT', clientId: 'c5', clientName: 'Summit Industrial', estimatedBudget: 14200, jobNumber: 'JOB-005', createdAt: '2024-03-10T00:00:00Z', estimatedHours: 48 },
  { id: 'j6', name: 'Hartley — 3 x EV Chargers (New Build)', status: 'ON_HOLD', clientId: 'c1', clientName: 'Hartley Homes', estimatedBudget: 7500, jobNumber: 'JOB-006', createdAt: '2024-03-12T00:00:00Z', estimatedHours: 24 },
];

const SEED_COSTS = [
  { id: 'co1', jobId: 'j1', description: 'Cable & conduit — full rewire', amount: 4800, category: 'Electrical Materials', date: '2024-01-22', totalCost: 4800 },
  { id: 'co2', jobId: 'j1', description: 'Switchboard & RCDs', amount: 1850, category: 'Electrical Materials', date: '2024-01-25', totalCost: 1850 },
  { id: 'co3', jobId: 'j1', description: 'Compliance inspection fee', amount: 450, category: 'Permits & Inspections', date: '2024-02-25', totalCost: 450 },
  { id: 'co4', jobId: 'j2', description: 'Main cable trunking — level 2 & 3', amount: 12400, category: 'Electrical Materials', date: '2024-02-15', totalCost: 12400 },
  { id: 'co5', jobId: 'j2', description: 'Commercial switchgear', amount: 8900, category: 'Electrical Materials', date: '2024-02-20', totalCost: 8900 },
  { id: 'co6', jobId: 'j2', description: 'Scissor lift hire — 3 days', amount: 2100, category: 'Equipment Hire', date: '2024-03-01', totalCost: 2100 },
  { id: 'co7', jobId: 'j2', description: 'Building consent & inspections', amount: 1200, category: 'Permits & Inspections', date: '2024-02-10', totalCost: 1200 },
  { id: 'co8', jobId: 'j3', description: 'LED fittings — 80 x hotel rooms', amount: 5600, category: 'Electrical Materials', date: '2024-03-05', totalCost: 5600 },
  { id: 'co9', jobId: 'j3', description: 'LED drivers & dimmers', amount: 1400, category: 'Electrical Materials', date: '2024-03-05', totalCost: 1400 },
];

const SEED_LABOR = [
  { id: 'la1', jobId: 'j1', workerName: 'Mike Taufa', role: 'Electrician', hoursWorked: 40, hoursTravel: 4, hourlyRate: 95, totalCost: 4180, date: '2024-02-01' },
  { id: 'la2', jobId: 'j1', workerName: 'Sam Porter', role: 'Electrician (2nd)', hoursWorked: 32, hoursTravel: 3, hourlyRate: 85, totalCost: 2975, date: '2024-02-10' },
  { id: 'la3', jobId: 'j2', workerName: 'Mike Taufa', role: 'Electrician', hoursWorked: 56, hoursTravel: 6, hourlyRate: 95, totalCost: 5890, date: '2024-03-01' },
  { id: 'la4', jobId: 'j2', workerName: 'Sam Porter', role: 'Electrician (2nd)', hoursWorked: 48, hoursTravel: 5, hourlyRate: 85, totalCost: 4505, date: '2024-03-01' },
  { id: 'la5', jobId: 'j2', workerName: 'Lee Grant', role: 'Apprentice', hoursWorked: 48, hoursTravel: 5, hourlyRate: 45, totalCost: 2385, date: '2024-03-10' },
  { id: 'la6', jobId: 'j3', workerName: 'Mike Taufa', role: 'Electrician', hoursWorked: 24, hoursTravel: 8, hourlyRate: 95, totalCost: 3040, date: '2024-03-10' },
];

const SEED_INVOICES = [
  { id: 'i1', jobId: 'j1', invoiceNumber: 'INV-001', amount: 11500, total: 13225, subtotal: 11500, tax: 1725, taxRate: 0.15, taxLabel: 'GST', status: 'PAID', dueDate: '2024-02-15T00:00:00Z', issueDate: '2024-01-25T00:00:00Z', paidAt: '2024-02-10T00:00:00Z' },
  { id: 'i2', jobId: 'j1', invoiceNumber: 'INV-002', amount: 9700, total: 11155, subtotal: 9700, tax: 1455, taxRate: 0.15, taxLabel: 'GST', status: 'PAID', dueDate: '2024-03-15T00:00:00Z', issueDate: '2024-02-28T00:00:00Z', paidAt: '2024-03-08T00:00:00Z', isFinal: true },
  { id: 'i3', jobId: 'j2', invoiceNumber: 'INV-003', amount: 28000, total: 32200, subtotal: 28000, tax: 4200, taxRate: 0.15, taxLabel: 'GST', status: 'EMAILED', dueDate: '2024-03-30T00:00:00Z', issueDate: '2024-03-01T00:00:00Z' },
  { id: 'i4', jobId: 'j3', invoiceNumber: 'INV-004', amount: 9500, total: 10925, subtotal: 9500, tax: 1425, taxRate: 0.15, taxLabel: 'GST', status: 'CREATED', dueDate: '2024-04-15T00:00:00Z', issueDate: '2024-03-15T00:00:00Z' },
  { id: 'i5', jobId: 'j2', invoiceNumber: 'INV-005', amount: 18500, total: 21275, subtotal: 18500, tax: 2775, taxRate: 0.15, taxLabel: 'GST', status: 'SENT', dueDate: '2024-02-01T00:00:00Z', issueDate: '2024-01-10T00:00:00Z' },
];

const SEED_CHANGE_ORDERS = [
  { id: 'ch1', jobId: 'j2', orderNumber: 'CO-001', title: 'Additional Emergency Lighting', description: 'Council requires emergency exit lighting on levels 2 & 3 — not in original spec.', amount: 4200, status: 'APPROVED', submittedBy: 'Demo User', submittedAt: '2024-02-18T09:00:00Z', actionedAt: '2024-02-20T14:00:00Z', reason: 'Regulatory requirement discovered during fit-out' },
  { id: 'ch2', jobId: 'j2', orderNumber: 'CO-002', title: 'Server Room Dedicated Circuit', description: 'Client requested dedicated 32A circuit for new server room expansion.', amount: 1850, status: 'PENDING', submittedBy: 'Demo User', submittedAt: '2024-03-05T11:00:00Z', actionedAt: null, reason: 'Scope change — IT expansion' },
  { id: 'ch3', jobId: 'j3', orderNumber: 'CO-003', title: 'Pool Area Weatherproof Lighting', description: 'Upgrade pool deck lights to IP66-rated weatherproof fittings.', amount: 2100, status: 'PENDING', submittedBy: 'Demo User', submittedAt: '2024-03-12T10:30:00Z', actionedAt: null, reason: 'Client requested upgrade during site walk' },
];

const SEED_NOTIFICATIONS = [
  { id: 'n1', type: 'WARNING', title: 'Budget Alert', message: 'Pacific Build job at 62% budget with work still ongoing', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', type: 'INFO', title: 'Change Order Awaiting Approval', message: 'CO-002 on Pacific Build job needs your approval', read: false, createdAt: new Date().toISOString() },
  { id: 'n3', type: 'WARNING', title: 'Invoice Overdue', message: 'INV-005 on Pacific Build was due 1 Feb — follow up required', read: false, createdAt: new Date().toISOString() },
  { id: 'n4', type: 'SUCCESS', title: 'Job Completed', message: 'Hartley St Residence rewire marked complete', read: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// Deep clone helper
function cloneData(d) { return JSON.parse(JSON.stringify(d)); }

// Live state — mutable working copies
let dataMode = 'demo'; // 'demo' | 'live'
let demoClients       = cloneData(SEED_CLIENTS);
let demoJobTemplates  = cloneData(SEED_JOB_TEMPLATES);
let demoJobs          = cloneData(SEED_JOBS);
let demoCosts         = cloneData(SEED_COSTS);
let demoLabor         = cloneData(SEED_LABOR);
let demoInvoices      = cloneData(SEED_INVOICES);
let demoChangeOrders  = cloneData(SEED_CHANGE_ORDERS);
let demoNotifications = cloneData(SEED_NOTIFICATIONS);
// budgets are computed; no seed needed

const demoBudgets = []; // computed dynamically in the budget route

// Mutable org settings — taxRate is the source of truth for all invoices
const demoOrgSettings = {
  name: 'Demo Organization',
  country: 'NZ',
  currency: 'NZD',
  taxLabel: 'GST',
  taxRate: 0.15,
  taxEnabled: true,
  timezone: 'Pacific/Auckland',
  invoicePrefix: 'INV',
  paymentTermsDays: 30,
  trackInvoicePayments: false,   // when false: statuses are CREATED/PRINTED/EMAILED only
};

// Onboarding state — cleared when org first sets up via wizard
let onboardingComplete = false;

// ─── Gemini AI Onboarding ─────────────────────────────────────────────────────
// API key loaded from environment — never hardcode in source
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.warn('[Onboarding] WARNING: GEMINI_API_KEY not set — AI onboarding will fail.');
}
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.get('/api/onboarding/status', (req, res) => {
  res.json({ complete: onboardingComplete });
});

app.post('/api/onboarding/complete', (req, res) => {
  onboardingComplete = true;
  res.json({ success: true });
});

app.post('/api/onboarding/setup', async (req, res) => {
  const { businessType, description, country = 'NZ' } = req.body;
  if (!businessType) return res.status(400).json({ error: 'businessType is required' });

  const prompt = `You are a setup assistant for a job costing application used by tradespeople and contractors.

Business details:
- Type: ${businessType}
- Description: ${description || 'Not provided'}
- Country: ${country}

Generate a complete tailored workspace setup as valid JSON only (no markdown, no explanation, just the raw JSON object).

Return EXACTLY this structure:

{
  "jobTemplates": [
    { "name": "string", "description": "string", "estimatedBudget": number }
  ],
  "costCategories": [
    { "name": "string", "unitType": "item" }
  ],
  "settings": {
    "taxLabel": "string",
    "taxRate": number,
    "currency": "string",
    "defaultLaborRate": number,
    "invoicePrefix": "string"
  },
  "welcomeMessage": "string",
  "demoData": {
    "clients": [
      { "name": "string", "contactName": "string", "email": "string", "phone": "string", "address": "string", "notes": "string" }
    ],
    "jobs": [
      { "name": "string", "clientIndex": number, "status": "string", "estimatedBudget": number, "estimatedHours": number }
    ],
    "costs": [
      { "jobIndex": number, "description": "string", "amount": number, "category": "string" }
    ],
    "labor": [
      { "jobIndex": number, "workerName": "string", "role": "string", "hoursWorked": number, "hourlyRate": number }
    ],
    "invoices": [
      { "jobIndex": number, "amount": number, "status": "string" }
    ],
    "changeOrders": [
      { "jobIndex": number, "title": "string", "description": "string", "amount": number, "status": "string" }
    ]
  }
}

Rules for templates and settings:
- Provide exactly 5-7 job templates realistic and specific to this trade
- Provide exactly 6-10 cost categories relevant to this trade
- unitType must be one of: item, hour, day, sqm, lm
- taxLabel and taxRate must match the country (NZ=GST 0.15, AU=GST 0.10, UK=VAT 0.20, US=no tax 0.00, CA=GST 0.05)
- currency: NZD for NZ, AUD for AU, GBP for UK, USD for US, CAD for CA
- defaultLaborRate: realistic hourly rate in local currency for this trade
- invoicePrefix: 2-4 uppercase letters based on the business type
- welcomeMessage: 1-2 sentences, warm and specific to their business

Rules for demoData — ALL content MUST be specific to the ${businessType} industry, not generic:
- clients: 3 realistic client names for a ${businessType} business in ${country}
- jobs: 5 realistic ${businessType} job names across mixed statuses (COMPLETED, IN_PROGRESS, PLANNING, DRAFT, ON_HOLD)
  - clientIndex: 0-based index into clients array
- costs: 6 realistic supply/material costs for ${businessType} work
  - jobIndex: 0-based index into jobs array; category must match a costCategory name
- labor: 4 realistic entries with worker names and roles for ${businessType}
  - jobIndex: 0-based index into jobs array
- invoices: 4 invoices with mixed statuses (PAID, EMAILED, SENT, CREATED)
  - jobIndex: 0-based index into jobs array; amount in local currency before tax
- changeOrders: 2 realistic scope-change requests for ${businessType}
  - jobIndex: 0-based index into jobs array; status: PENDING or APPROVED
- Return ONLY the JSON object, no other text`;

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('[Onboarding] Gemini error:', err);
      return res.status(502).json({ error: 'AI service error', detail: err });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Robustly extract the outermost JSON object, handling markdown fences and truncation
    let setup;
    try {
      // Strip markdown code fences
      let cleaned = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
      // Find the first '{' and last '}' to extract the JSON block
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1) throw new Error('No JSON object found in response');
      // If truncated (no closing '}'), attempt to close it gracefully
      const jsonStr = end > start ? cleaned.slice(start, end + 1) : cleaned.slice(start) + '}';
      setup = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[Onboarding] JSON parse error:', e.message, '\nRaw (first 500):', rawText.slice(0, 500));
      return res.status(502).json({ error: 'Failed to parse AI response', detail: e.message });
    }

    // Apply settings to org
    if (setup.settings) {
      const s = setup.settings;
      if (s.taxLabel) demoOrgSettings.taxLabel = s.taxLabel;
      if (s.taxRate !== undefined) demoOrgSettings.taxRate = s.taxRate;
      if (s.currency) demoOrgSettings.currency = s.currency;
      if (s.invoicePrefix) demoOrgSettings.invoicePrefix = s.invoicePrefix;
      if (country) demoOrgSettings.country = country;
      if (s.defaultLaborRate) demoOrgSettings.defaultLaborRate = s.defaultLaborRate;
    }

    // Create job templates
    demoJobTemplates = [];
    const createdTemplates = [];
    if (Array.isArray(setup.jobTemplates)) {
      for (const t of setup.jobTemplates) {
        const tmpl = {
          id: `t${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          name: t.name,
          description: t.description || '',
          estimatedBudget: t.estimatedBudget || 0,
          isTemplate: true,
          createdAt: new Date().toISOString(),
        };
        demoJobTemplates.push(tmpl);
        createdTemplates.push(tmpl);
      }
    }

    // Create cost categories
    const existingCatNames = new Set();
    const createdCategories = [];
    if (Array.isArray(setup.costCategories)) {
      let catId = 10;
      for (const c of setup.costCategories) {
        if (!existingCatNames.has(c.name)) {
          existingCatNames.add(c.name);
          createdCategories.push({ id: String(catId++), name: c.name, unitType: c.unitType || 'item', isActive: true });
        }
      }
    }

    // ── Populate AI-generated demo data ────────────────────────────────────────
    const dd = setup.demoData;
    if (dd) {
      const now = new Date();
      const ts = (daysAgo = 0) => new Date(now - daysAgo * 86400000).toISOString();
      const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

      // Clients
      demoClients = (dd.clients || []).map((c, i) => ({
        id: `dc${i}`,
        name: c.name || 'Unknown Client',
        contactName: c.contactName || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
        createdAt: ts(90),
      }));

      // Jobs — map clientIndex → client
      demoJobs = (dd.jobs || []).map((j, i) => {
        const client = demoClients[j.clientIndex] || demoClients[0] || {};
        return {
          id: `dj${i}`,
          name: j.name || `Job ${i+1}`,
          status: j.status || 'DRAFT',
          clientId: client.id,
          clientName: client.name,
          estimatedBudget: j.estimatedBudget || 0,
          estimatedHours: j.estimatedHours || 0,
          jobNumber: `JOB-${String(i+1).padStart(3,'0')}`,
          createdAt: ts(60 - i * 7),
          startedAt: ['IN_PROGRESS','COMPLETED'].includes(j.status) ? ts(50 - i * 7) : undefined,
          completedAt: j.status === 'COMPLETED' ? ts(10 - i) : undefined,
        };
      });

      // Costs
      demoCosts = (dd.costs || []).map((c, i) => {
        const job = demoJobs[c.jobIndex] || demoJobs[0] || {};
        return {
          id: `dc${i}`,
          jobId: job.id,
          description: c.description || 'Cost entry',
          amount: c.amount || 0,
          totalCost: c.amount || 0,
          category: c.category || 'Materials',
          date: ts(40 - i * 3).split('T')[0],
        };
      });

      // Labor
      demoLabor = (dd.labor || []).map((l, i) => {
        const job = demoJobs[l.jobIndex] || demoJobs[0] || {};
        const rate = l.hourlyRate || setup.settings?.defaultLaborRate || 75;
        const hrs = l.hoursWorked || 8;
        return {
          id: `dl${i}`,
          jobId: job.id,
          workerName: l.workerName || 'Worker',
          role: l.role || businessType,
          hoursWorked: hrs,
          hoursTravel: 0.5,
          hourlyRate: rate,
          totalCost: Math.round(hrs * rate),
          date: ts(35 - i * 4).split('T')[0],
        };
      });

      // Invoices
      const taxRate = setup.settings?.taxRate || 0;
      const taxLabel = setup.settings?.taxLabel || 'Tax';
      const prefix = setup.settings?.invoicePrefix || 'INV';
      demoInvoices = (dd.invoices || []).map((inv, i) => {
        const job = demoJobs[inv.jobIndex] || demoJobs[0] || {};
        const sub = inv.amount || 0;
        const tax = Math.round(sub * taxRate * 100) / 100;
        return {
          id: `di${i}`,
          jobId: job.id,
          invoiceNumber: `${prefix}-${String(i+1).padStart(3,'0')}`,
          subtotal: sub,
          tax,
          taxRate,
          taxLabel,
          total: Math.round((sub + tax) * 100) / 100,
          status: inv.status || 'CREATED',
          issueDate: ts(30 - i * 7),
          dueDate: ts(0 - i * 7),
          paidAt: inv.status === 'PAID' ? ts(20 - i * 5) : undefined,
          isFinal: i === (dd.invoices.length - 1) && job.status === 'COMPLETED',
        };
      });

      // Change Orders
      demoChangeOrders = (dd.changeOrders || []).map((co, i) => {
        const job = demoJobs[co.jobIndex] || demoJobs[0] || {};
        return {
          id: `dco${i}`,
          jobId: job.id,
          orderNumber: `CO-${String(i+1).padStart(3,'0')}`,
          title: co.title || 'Change Order',
          description: co.description || '',
          amount: co.amount || 0,
          status: co.status || 'PENDING',
          submittedBy: 'Demo User',
          submittedAt: ts(20 - i * 3),
          actionedAt: co.status === 'APPROVED' ? ts(18 - i * 3) : null,
          reason: co.description || '',
        };
      });

      // Notifications — generic but correct
      demoNotifications = [
        { id: 'n1', type: 'INFO', title: 'Welcome!', message: `Your ${businessType} workspace is set up and ready to use.`, read: false, createdAt: ts(0) },
        ...(demoChangeOrders.filter(co => co.status === 'PENDING').length > 0 ? [{
          id: 'n2', type: 'INFO', title: 'Pending Approvals',
          message: `${demoChangeOrders.filter(co => co.status === 'PENDING').length} change order(s) awaiting your approval`,
          read: false, createdAt: ts(0),
        }] : []),
      ];
    }

    dataMode = 'demo';
    onboardingComplete = true;

    res.json({
      success: true,
      setup,
      created: {
        templates: createdTemplates.length,
        categories: createdCategories.length,
      },
      jobTemplates: createdTemplates,
      costCategories: createdCategories,
      settings: demoOrgSettings,
    });

  } catch (err) {
    console.error('[Onboarding] Unexpected error:', err);
    res.status(500).json({ error: 'Onboarding failed', detail: String(err) });
  }
});

// ─── Workspace Admin Endpoints ─────────────────────────────────────────────────

// Returns current data mode so the UI can show the correct badge
app.get('/api/admin/workspace-status', (req, res) => {
  res.json({ dataMode });
});

// Password check — in demo mode any non-empty password is accepted.
// In production this would verify against the real user record.
function verifyPassword(password) {
  return typeof password === 'string' && password.length > 0;
}

// POST /api/admin/go-live
// Clears all transactional data (jobs, costs, labour, invoices, change orders, clients)
// but keeps templates and categories. Switches mode to 'live'.
app.post('/api/admin/go-live', (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  demoJobs          = [];
  demoCosts         = [];
  demoLabor         = [];
  demoInvoices      = [];
  demoChangeOrders  = [];
  demoClients       = [];
  demoNotifications = [];
  dataMode          = 'live';
  onboardingComplete = true;
  console.log('[Admin] Switched to LIVE mode — all transactional data cleared.');
  res.json({ success: true, dataMode });
});

// POST /api/admin/clear-data
// Clears ALL transactional data AND any user-added templates/categories beyond the seeds.
// Keeps the AI-generated templates from onboarding. Stays in current mode.
app.post('/api/admin/clear-data', (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  demoJobs          = [];
  demoCosts         = [];
  demoLabor         = [];
  demoInvoices      = [];
  demoChangeOrders  = [];
  demoClients       = [];
  demoNotifications = [];
  // Templates are intentionally kept
  console.log('[Admin] All data cleared — templates preserved.');
  res.json({ success: true, dataMode });
});

// POST /api/admin/redo-setup
// Resets onboarding flag and clears all data (templates included) so the wizard
// runs again from scratch on next page load.
app.post('/api/admin/redo-setup', (req, res) => {
  const { password } = req.body;
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  demoJobs          = [];
  demoCosts         = [];
  demoLabor         = [];
  demoInvoices      = [];
  demoChangeOrders  = [];
  demoClients       = [];
  demoNotifications = [];
  demoJobTemplates  = [];
  dataMode          = 'live';
  onboardingComplete = false;
  console.log('[Admin] Redo-setup triggered — all data + templates cleared, onboarding reset.');
  res.json({ success: true, dataMode });
});

// Auth endpoints (demo)
app.post('/api/auth/login', (req, res) => {
  const payload = {
    userId: '1',
    email: req.body.email || 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'ADMIN',
    organizationId: '1',
    organizationName: 'Demo Organization',
    permissions: ['jobs:read', 'jobs:write', 'costs:read', 'costs:write', 'labor:read', 'labor:write', 'invoices:read', 'invoices:write', 'reports:read', 'approvals:write'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  res.json({
    user: { id: '1', email: payload.email, firstName: 'Demo', lastName: 'User', role: 'ADMIN', organization: { id: '1', name: 'Demo Organization' } },
    accessToken: makeDemoJwt(payload),
    refreshToken: 'demo-refresh-token-' + Date.now(),
  });
});

app.post('/api/auth/register', (req, res) => {
  const payload = {
    userId: '1',
    email: req.body.email,
    firstName: req.body.firstName || 'New',
    lastName: req.body.lastName || 'User',
    role: 'ADMIN',
    organizationId: '1',
    organizationName: req.body.organizationName || 'New Organization',
    permissions: ['jobs:read', 'jobs:write', 'costs:read', 'costs:write', 'labor:read', 'labor:write', 'invoices:read', 'invoices:write', 'reports:read', 'approvals:write'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  };
  res.json({
    user: { id: '1', email: payload.email, firstName: payload.firstName, lastName: payload.lastName, role: 'ADMIN', organization: { id: '1', name: payload.organizationName } },
    accessToken: makeDemoJwt(payload),
    refreshToken: 'demo-refresh-token-' + Date.now(),
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const payload = {
    userId: '1', email: 'demo@example.com', firstName: 'Demo', lastName: 'User',
    role: 'ADMIN', organizationId: '1', organizationName: 'Demo Organization',
    permissions: ['jobs:read', 'jobs:write', 'costs:read', 'costs:write'],
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400,
  };
  res.json({ accessToken: makeDemoJwt(payload) });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Jobs
function nextJobNumber() {
  const max = demoJobs.reduce((n, j) => Math.max(n, parseInt(j.jobNumber?.replace('JOB-','') || '0')), 0);
  return `JOB-${String(max + 1).padStart(3, '0')}`;
}
app.get('/api/jobs', (req, res) => {
  const { clientId, search, status } = req.query;
  let jobs = demoJobs.filter(j => !j.isTemplate);
  if (clientId) jobs = jobs.filter(j => j.clientId === clientId);
  if (status) jobs = jobs.filter(j => j.status === status);
  if (search) jobs = jobs.filter(j => j.name.toLowerCase().includes(search.toLowerCase()) || (j.clientName||'').toLowerCase().includes(search.toLowerCase()));
  res.json(jobs);
});
app.get('/api/jobs/templates', (req, res) => res.json(demoJobTemplates));
app.get('/api/jobs/:id', (req, res) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (job) {
    const client = job.clientId ? demoClients.find(c => c.id === job.clientId) : null;
    res.json({
      ...job,
      client,
      costs: demoCosts.filter(c => c.jobId === job.id),
      labor: demoLabor.filter(l => l.jobId === job.id),
    });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});
app.post('/api/jobs', (req, res) => {
  const { templateId, clientId, ...rest } = req.body;
  let baseData = { ...rest };
  // Apply template defaults
  if (templateId) {
    const tmpl = demoJobTemplates.find(t => t.id === templateId);
    if (tmpl) {
      baseData = { description: tmpl.description, estimatedBudget: tmpl.estimatedBudget, ...rest };
    }
  }
  // Resolve client name from clientId if bound
  if (clientId) {
    const client = demoClients.find(c => c.id === clientId);
    baseData.clientId = clientId;
    baseData.clientName = client?.name || baseData.clientName;
  }
  const newJob = { ...baseData, id: String(Date.now()), jobNumber: nextJobNumber(), createdAt: new Date().toISOString() };
  demoJobs.push(newJob);
  res.status(201).json(newJob);
});
app.patch('/api/jobs/:id', (req, res) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  // Re-resolve client name if clientId changes
  if (req.body.clientId) {
    const client = demoClients.find(c => c.id === req.body.clientId);
    req.body.clientName = client?.name || req.body.clientName;
  }
  Object.assign(job, req.body);
  res.json(job);
});
// Complete a job — atomic workflow
app.post('/api/jobs/:id/complete', (req, res) => {
  const job = demoJobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status === 'COMPLETED') return res.status(400).json({ error: 'Job is already completed' });

  const { sendEmail = false, notes = '' } = req.body;
  const now = new Date().toISOString();
  const actions = [];

  // 1. Calculate uninvoiced balance
  const jobCosts = demoCosts.filter(c => c.jobId === job.id);
  const jobLabor = demoLabor.filter(l => l.jobId === job.id);
  const totalCosts = jobCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const totalLabor = jobLabor.reduce((s, l) => s + ((l.hoursWorked || 0) * (l.hourlyRate || 65)), 0);
  const totalActual = totalCosts + totalLabor;

  const existingInvoices = demoInvoices.filter(i => i.jobId === job.id);
  const alreadyInvoiced = existingInvoices.reduce((s, i) => s + (i.subtotal || 0), 0);
  const uninvoicedAmount = Math.max(totalActual - alreadyInvoiced, 0);

  // 2. Create final invoice if there's an outstanding balance
  let finalInvoice = null;
  if (uninvoicedAmount > 0) {
    const orgSettings = demoOrgSettings;
    // taxRate is already stored as a decimal (e.g. 0.15), do NOT divide by 100
    const taxRate = orgSettings.taxEnabled ? (orgSettings.taxRate || 0) : 0;
    const subtotal = uninvoicedAmount;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + taxAmount;
    const invNum = `INV-${String(demoInvoices.length + 1).padStart(3, '0')}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    finalInvoice = {
      id: String(Date.now()),
      jobId: job.id,
      invoiceNumber: invNum,
      status: 'PENDING',
      issueDate: now,
      dueDate,
      subtotal,
      taxAmount,
      taxLabel: orgSettings.taxLabel || 'GST',
      taxRate: orgSettings.taxRate || 15,
      total,
      notes: notes || 'Final invoice — job completion.',
      isFinal: true,
      createdAt: now,
    };
    demoInvoices.push(finalInvoice);
    actions.push({ type: 'invoice_created', label: `Final invoice ${invNum} created`, amount: total });
  } else {
    actions.push({ type: 'invoice_skipped', label: 'No outstanding balance — no invoice needed' });
  }

  // 3. Close pending change orders
  const pendingCOs = demoChangeOrders.filter(co => co.jobId === job.id && co.status === 'PENDING');
  pendingCOs.forEach(co => {
    co.status = 'REJECTED';
    co.actionedAt = now;
    co.actionNote = 'Auto-closed on job completion';
    actions.push({ type: 'change_order_closed', label: `Change order ${co.orderNumber} closed` });
  });

  // 4. Mark job as completed
  job.status = 'COMPLETED';
  job.completedAt = now;
  if (notes) job.completionNotes = notes;
  actions.push({ type: 'status_updated', label: 'Job status set to Completed' });
  actions.push({ type: 'timestamp_set', label: `Completion date recorded: ${new Date(now).toLocaleDateString('en-NZ')}` });

  // 5. Simulate email
  const client = job.clientId ? demoClients.find(c => c.id === job.clientId) : null;
  if (sendEmail && client?.email && finalInvoice) {
    actions.push({ type: 'email_sent', label: `Invoice emailed to ${client.email}` });
  } else if (sendEmail && !client?.email) {
    actions.push({ type: 'email_skipped', label: 'No client email on file — email not sent' });
  }

  res.json({
    job,
    finalInvoice,
    actions,
    summary: {
      uninvoicedAmount,
      alreadyInvoiced,
      totalActual,
      clientEmail: client?.email || null,
      pendingCOsClosed: pendingCOs.length,
    },
  });
});

app.post('/api/jobs/:id/copy', (req, res) => {
  const src = demoJobs.find(j => j.id === req.params.id);
  if (!src) return res.status(404).json({ error: 'Job not found' });
  const { name, clientId, startedAt } = req.body;
  const client = clientId ? demoClients.find(c => c.id === clientId) : (src.clientId ? demoClients.find(c => c.id === src.clientId) : null);
  const copy = {
    ...src,
    id: String(Date.now()),
    jobNumber: nextJobNumber(),
    name: name || `${src.name} (Copy)`,
    status: 'DRAFT',
    clientId: clientId || src.clientId || null,
    clientName: client?.name || src.clientName || null,
    startedAt: startedAt || null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  demoJobs.push(copy);
  res.status(201).json(copy);
});

// Job Templates CRUD
app.post('/api/jobs/templates', (req, res) => {
  const tmpl = { ...req.body, id: `t${Date.now()}`, isTemplate: true, createdAt: new Date().toISOString() };
  demoJobTemplates.push(tmpl);
  res.status(201).json(tmpl);
});
app.put('/api/jobs/templates/:id', (req, res) => {
  const idx = demoJobTemplates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  demoJobTemplates[idx] = { ...demoJobTemplates[idx], ...req.body, id: req.params.id };
  res.json(demoJobTemplates[idx]);
});
app.delete('/api/jobs/templates/:id', (req, res) => {
  const idx = demoJobTemplates.findIndex(t => t.id === req.params.id);
  if (idx !== -1) demoJobTemplates.splice(idx, 1);
  res.status(204).end();
});

// Clients CRUD
app.get('/api/clients', (req, res) => {
  const { search } = req.query;
  let clients = [...demoClients];
  if (search) clients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.contactName||'').toLowerCase().includes(search.toLowerCase()));
  res.json(clients);
});
app.get('/api/clients/:id', (req, res) => {
  const client = demoClients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  const jobs = demoJobs.filter(j => j.clientId === client.id && !j.isTemplate);
  res.json({ ...client, jobs });
});
app.post('/api/clients', (req, res) => {
  const client = { ...req.body, id: String(Date.now()), createdAt: new Date().toISOString() };
  demoClients.push(client);
  res.status(201).json(client);
});
app.put('/api/clients/:id', (req, res) => {
  const idx = demoClients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  demoClients[idx] = { ...demoClients[idx], ...req.body, id: req.params.id };
  // Keep clientName in sync on related jobs
  demoJobs.filter(j => j.clientId === req.params.id).forEach(j => { j.clientName = demoClients[idx].name; });
  res.json(demoClients[idx]);
});
app.delete('/api/clients/:id', (req, res) => {
  const idx = demoClients.findIndex(c => c.id === req.params.id);
  if (idx !== -1) demoClients.splice(idx, 1);
  res.status(204).end();
});


// Costs
app.get('/api/costs', (req, res) => res.json(demoCosts));
// /api/costs/job/:jobId — used by costsService.getCostsByJob()
app.get('/api/costs/job/:jobId', (req, res) => {
  const costs = demoCosts
    .filter(c => c.jobId === req.params.jobId)
    .map(c => ({ ...c, category: { id: c.category, name: c.category }, totalCost: c.amount }));
  res.json(costs);
});
app.get('/api/costs/categories', (req, res) => res.json([
  { id: '1', name: 'Materials', unitType: 'item', isActive: true },
  { id: '2', name: 'Labor', unitType: 'hour', isActive: true },
  { id: '3', name: 'Equipment', unitType: 'day', isActive: true },
  { id: '4', name: 'Subcontract', unitType: 'item', isActive: true },
]));
app.get('/api/costs/:id', (req, res) => {
  const cost = demoCosts.find(c => c.id === req.params.id);
  if (cost) res.json(cost);
  else res.status(404).json({ error: 'Cost not found' });
});
app.post('/api/costs', (req, res) => {
  // Validate date range: ±90 days past, 30 days future
  if (req.body.date && !isValidDateRange(req.body.date)) {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: 'Date must be within 90 days in the past and 30 days in the future'
    });
  }
  const newCost = { ...req.body, id: String(Date.now()), totalCost: req.body.amount || 0 };
  demoCosts.push(newCost);
  res.status(201).json(newCost);
});
app.patch('/api/costs/:id', (req, res) => {
  const cost = demoCosts.find(c => c.id === req.params.id);
  if (cost) Object.assign(cost, req.body);
  res.json(cost);
});

// Labor
app.get('/api/labor', (req, res) => res.json(demoLabor));
// /api/labor/job/:jobId — used by laborService.getLaborByJob()
app.get('/api/labor/job/:jobId', (req, res) => {
  res.json(demoLabor.filter(l => l.jobId === req.params.jobId));
});
app.get('/api/labor/:id', (req, res) => {
  const labor = demoLabor.find(l => l.id === req.params.id);
  if (labor) res.json(labor);
  else res.status(404).json({ error: 'Labor entry not found' });
});
app.post('/api/labor', (req, res) => {
  const newLabor = { 
    ...req.body, 
    id: String(Date.now()),
    hoursWorked: req.body.hoursWorked || 0,
    hoursTravel: req.body.hoursTravel || 0,
    totalCost: Math.round(((req.body.hoursWorked || 0) + (req.body.hoursTravel || 0)) * (req.body.hourlyRate || 65) * 100) / 100,
  };
  demoLabor.push(newLabor);
  res.status(201).json(newLabor);
});
app.patch('/api/labor/:id', (req, res) => {
  const labor = demoLabor.find(l => l.id === req.params.id);
  if (labor) Object.assign(labor, req.body);
  res.json(labor);
});

// Budget
app.get('/api/budget', (req, res) => res.json(demoBudgets));
app.get('/api/budget/:jobId/summary', (req, res) => {
  const jobId = req.params.jobId;
  const job = demoJobs.find(j => j.id === jobId);
  const jobBudgets = demoBudgets.filter(b => b.jobId === jobId);
  const jobCosts = demoCosts.filter(c => c.jobId === jobId);
  const jobLabor = demoLabor.filter(l => l.jobId === jobId);
  const estimatedBudget = job?.estimatedBudget || 0;
  const totalCosts = jobCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const totalLabor = jobLabor.reduce((s, l) => s + ((l.hoursWorked || 0) * (l.hourlyRate || 0)), 0);
  const totalActual = totalCosts + totalLabor;
  const variance = estimatedBudget - totalActual;
  const variancePercent = estimatedBudget > 0 ? (variance / estimatedBudget) * 100 : 0;
  const status = variancePercent > 10 ? 'under' : variancePercent >= -5 ? 'on_track' : 'over';
  res.json({
    jobId,
    jobName: job?.name || '',
    estimatedBudget,
    totalCosts,
    totalLabor,
    totalChangeOrders: 0,
    committedCosts: totalCosts,
    committedLabor: totalLabor,
    committedChangeOrders: 0,
    totalActual,
    totalCommitted: totalActual,
    totalVariance: variance,
    variance,
    variancePercent,
    status,
    byCategory: jobBudgets.map(b => ({
      categoryId: b.id,
      categoryName: b.category?.name || 'Uncategorized',
      estimated: b.estimated || 0,
      actual: b.actual || 0,
      variance: (b.estimated || 0) - (b.actual || 0),
      variancePercent: (b.estimated || 0) > 0 ? (((b.estimated || 0) - (b.actual || 0)) / (b.estimated || 0)) * 100 : 0,
      status: 'under',
    })),
    recentCosts: jobCosts.slice(0, 5),
    recentLabor: jobLabor.slice(0, 5),
  });
});

// Change orders
app.get('/api/change-orders', (req, res) => {
  const { status, jobId } = req.query;
  let filtered = demoChangeOrders;
  if (status) filtered = filtered.filter(co => co.status === status);
  if (jobId) filtered = filtered.filter(co => co.jobId === jobId);

  // Enrich with job + client
  const enriched = filtered.map(co => {
    const job = demoJobs.find(j => j.id === co.jobId);
    const client = job?.clientId ? demoClients.find(c => c.id === job.clientId) : null;
    return {
      ...co,
      job: job ? { id: job.id, name: job.name, jobNumber: job.jobNumber, status: job.status } : null,
      client: client ? { id: client.id, name: client.name } : null,
    };
  });
  res.json(enriched);
});

app.get('/api/change-orders/pending', (req, res) => res.json(demoChangeOrders.filter(co => co.status === 'PENDING')));
// /api/change-orders/job/:jobId — used by changeOrdersService.getChangeOrdersByJob()
app.get('/api/change-orders/job/:jobId', (req, res) => {
  res.json(demoChangeOrders.filter(co => co.jobId === req.params.jobId));
});
app.get('/api/change-orders/:id', (req, res) => {
  const co = demoChangeOrders.find(c => c.id === req.params.id);
  if (co) res.json(co);
  else res.status(404).json({ error: 'Change order not found' });
});
app.post('/api/change-orders', (req, res) => {
  const newCO = {
    ...req.body,
    id: String(Date.now()),
    status: req.body.status || 'PENDING',
    submittedAt: new Date().toISOString(),
    actionedAt: null,
  };
  demoChangeOrders.push(newCO);
  res.status(201).json(newCO);
});
app.patch('/api/change-orders/:id/approve', (req, res) => {
  const co = demoChangeOrders.find(c => c.id === req.params.id);
  if (co) co.status = req.body.status || 'APPROVED';
  res.json(co);
});

// Invoices
app.get('/api/invoices', (req, res) => {
  const { jobId, status, clientId } = req.query;
  let filtered = demoInvoices;
  if (jobId) filtered = filtered.filter(i => i.jobId === jobId);
  if (status) filtered = filtered.filter(i => i.status === status);

  // Enrich each invoice with job + client summary
  const enriched = filtered.map(inv => {
    const job = demoJobs.find(j => j.id === inv.jobId);
    const client = job?.clientId ? demoClients.find(c => c.id === job.clientId) : null;
    // Compute subtotal from costs if not stored
    const jobCosts = demoCosts.filter(c => c.jobId === inv.jobId);
    const storedSubtotal = inv.subtotal || jobCosts.reduce((s, c) => s + (c.amount || c.totalCost || 0), 0) || inv.amount || 0;
    const taxRate = demoOrgSettings.taxEnabled ? (demoOrgSettings.taxRate || 0) : 0;
    const taxAmount = Math.round(storedSubtotal * taxRate * 100) / 100;
    const total = inv.total || (storedSubtotal + taxAmount);
    return {
      ...inv,
      subtotal: storedSubtotal,
      total,
      jobName: job?.name || null,
      jobNumber: job?.jobNumber || null,
      clientName: client?.name || job?.clientName || null,
      clientId: client?.id || job?.clientId || null,
    };
  });

  const result = clientId ? enriched.filter(i => i.clientId === clientId) : enriched;

  res.json({
    invoices: result,
    pagination: { total: result.length, page: 1, limit: 500, totalPages: 1 },
    trackInvoicePayments: demoOrgSettings.trackInvoicePayments ?? false,
  });
});
app.get('/api/invoices/:id', (req, res) => {
  const inv = demoInvoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  // Enrich with job + client details
  const job = demoJobs.find(j => j.id === inv.jobId);
  const client = job?.clientId ? demoClients.find(c => c.id === job.clientId) : null;

  // Build line items from cost entries for this job
  const jobCosts = demoCosts.filter(c => c.jobId === inv.jobId);
  const lineItems = jobCosts.length > 0
    ? jobCosts.map(c => {
        const cost = c.amount || c.totalCost || 0;
        const cat = typeof c.category === 'string' ? c.category : c.category?.name || 'General';
        return {
          description: `${c.description}${c.vendor ? ' (' + c.vendor + ')' : ''}`,
          category: cat,
          qty: 1,
          unitPrice: cost,
          total: cost,
        };
      })
    : [{ description: job?.name || 'Services rendered', category: 'Services', qty: 1, unitPrice: inv.subtotal || inv.amount || 0, total: inv.subtotal || inv.amount || 0 }];

  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
  const taxRate = demoOrgSettings.taxEnabled ? demoOrgSettings.taxRate : 0;
  const taxLabel = demoOrgSettings.taxLabel || 'Tax';

  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const grandTotal = subtotal + taxAmount;

  res.json({
    ...inv,
    subtotal,
    tax: taxAmount,
    taxRate,
    taxLabel,
    total: grandTotal,
    lineItems,

    job: job ? { id: job.id, name: job.name, jobNumber: job.jobNumber, description: job.description } : null,
    client: client ? {
      name: client.name,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      address: client.address || '123 Client Street',
    } : null,
    paymentTerms: 'Payment due within 30 days of invoice date.',
    notes: 'Thank you for your business. Please reference the invoice number with your payment.',
    company: {
      name: 'Demo Organization',
      address: '1 Builder Lane, Auckland 1010',
      phone: '+64 9 000 0000',
      email: 'accounts@demoorg.co.nz',
      gstNumber: 'GST 123-456-789',
    },
  });
});

app.post('/api/invoices', (req, res) => {
  const inv = {
    ...req.body,
    id: String(Date.now()),
    status: 'CREATED',
    createdAt: new Date().toISOString(),
  };
  demoInvoices.push(inv);
  res.status(201).json(inv);
});
app.patch('/api/invoices/:id', (req, res) => {
  const inv = demoInvoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  Object.assign(inv, req.body);
  res.json(inv);
});
// Explicit status transition endpoint
app.patch('/api/invoices/:id/status', (req, res) => {
  const inv = demoInvoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const { status } = req.body;
  const allowed = demoOrgSettings.trackInvoicePayments
    ? ['CREATED', 'PRINTED', 'EMAILED', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']
    : ['CREATED', 'PRINTED', 'EMAILED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `Status '${status}' not allowed with current settings` });
  inv.status = status;
  if (status === 'PAID') inv.paidAt = new Date().toISOString();
  if (status === 'PRINTED') inv.printedAt = new Date().toISOString();
  if (status === 'EMAILED') inv.emailedAt = new Date().toISOString();
  res.json(inv);
});

// Notifications
// Organization settings
app.get('/api/organization/settings', (req, res) => res.json(demoOrgSettings));
app.patch('/api/organization/settings', (req, res) => {
  const allowed = ['name', 'country', 'currency', 'taxLabel', 'taxRate', 'taxEnabled', 'timezone', 'invoicePrefix', 'paymentTermsDays', 'trackInvoicePayments'];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) demoOrgSettings[key] = req.body[key];
  });
  res.json(demoOrgSettings);
});

app.get('/api/notifications', (req, res) => res.json(demoNotifications));

app.get('/api/notifications/unread', (req, res) => res.json(demoNotifications.filter(n => !n.read)));
app.get('/api/notifications/unread/count', (req, res) => res.json({ count: demoNotifications.filter(n => !n.read).length }));
app.patch('/api/notifications/:id/read', (req, res) => {
  const n = demoNotifications.find(n => n.id === req.params.id);
  if (n) n.read = true;
  res.json(n);
});
app.patch('/api/notifications/read-all', (req, res) => {
  demoNotifications.forEach(n => n.read = true);
  res.json({ success: true });
});

// Reports
app.get('/api/reports/profit-loss', (req, res) => res.json({
  period: req.query.startDate + ' to ' + req.query.endDate,
  totalRevenue: 125000,
  totalCosts: 48500,
  laborCosts: 18500,
  materialCosts: 25000,
  equipmentCosts: 5000,
  profit: 76500,
  margin: 61.2,
}));
app.get('/api/reports/labor-analysis', (req, res) => res.json({
  totalHours: 14.5,
  billableHours: 14,
  nonBillableHours: 0.5,
  avgHourlyRate: 47.1,
  totalLaborCost: 12425,
}));

// Extended report endpoints consumed by reportsService
// Dashboard summary — computed from live demo data
app.get('/api/dashboard/summary', (req, res) => {
  const activeJobs = demoJobs.filter(j => !j.isTemplate && ['ACTIVE','IN_PROGRESS','PLANNING'].includes(j.status));
  const allJobs = demoJobs.filter(j => !j.isTemplate);

  // Compute actuals per job
  const jobHealth = allJobs.map(job => {
    const costs = demoCosts.filter(c => c.jobId === job.id).reduce((s, c) => s + (c.amount || 0), 0);
    const labor = demoLabor.filter(l => l.jobId === job.id).reduce((s, l) => s + (l.totalCost || 0), 0);
    const totalActual = costs + labor;
    const budget = job.estimatedBudget || 0;
    const pct = budget > 0 ? (totalActual / budget) * 100 : 0;
    const risk = pct >= 90 ? 'over' : pct >= 75 ? 'at_risk' : 'on_track';
    return { ...job, totalActual, totalCosts: costs, totalLabor: labor, budgetPct: Math.round(pct), risk, variance: budget - totalActual };
  });

  const atRisk = jobHealth.filter(j => j.risk !== 'on_track' && !['COMPLETED','CANCELLED'].includes(j.status));
  const totalBudget = allJobs.reduce((s, j) => s + (j.estimatedBudget || 0), 0);
  const totalSpent = jobHealth.reduce((s, j) => s + j.totalActual, 0);
  const pendingInvoices = demoInvoices.filter(i => i.status === 'SENT');
  const pendingApprovals = demoChangeOrders.filter(co => co.status === 'PENDING');

  res.json({
    kpis: {
      totalJobs: allJobs.length,
      activeJobs: activeJobs.length,
      totalBudget,
      totalSpent,
      pendingInvoiceCount: pendingInvoices.length,
      pendingInvoiceValue: pendingInvoices.reduce((s, i) => s + (i.total || 0), 0),
      pendingApprovals: pendingApprovals.length,
      atRiskCount: atRisk.length,
    },
    atRiskJobs: atRisk.slice(0, 5).map(j => ({
      id: j.id, jobNumber: j.jobNumber, name: j.name, clientName: j.clientName,
      estimatedBudget: j.estimatedBudget, totalActual: j.totalActual,
      budgetPct: j.budgetPct, risk: j.risk, status: j.status,
    })),
    recentJobs: [...allJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(j => {
      const h = jobHealth.find(x => x.id === j.id);
      return { id: j.id, jobNumber: j.jobNumber, name: j.name, clientName: j.clientName, status: j.status, budgetPct: h?.budgetPct || 0, risk: h?.risk || 'on_track' };
    }),
    generatedAt: new Date().toISOString(),
  });
});

// WIP (Work-in-Progress) Report
app.get('/api/reports/wip', (req, res) => {
  const jobs = demoJobs.filter(j => !j.isTemplate && !['CANCELLED'].includes(j.status));
  const rows = jobs.map(job => {
    const costs = demoCosts.filter(c => c.jobId === job.id).reduce((s, c) => s + (c.amount || 0), 0);
    const labor = demoLabor.filter(l => l.jobId === job.id).reduce((s, l) => s + (l.totalCost || 0), 0);
    const totalCostsToDate = costs + labor;
    const contractValue = job.estimatedBudget || 0;
    const billedToDate = demoInvoices.filter(i => i.jobId === job.id).reduce((s, i) => s + (i.total || 0), 0);
    const pctComplete = contractValue > 0 ? Math.min((totalCostsToDate / contractValue) * 100, 100) : 0;
    const earnedRevenue = (pctComplete / 100) * contractValue;
    const overUnderBilling = billedToDate - earnedRevenue;
    return {
      jobId: job.id, jobNumber: job.jobNumber, jobName: job.name, clientName: job.clientName,
      status: job.status, contractValue, totalCostsToDate, billedToDate,
      pctComplete: Math.round(pctComplete * 10) / 10,
      earnedRevenue: Math.round(earnedRevenue),
      overUnderBilling: Math.round(overUnderBilling),
      billingStatus: Math.abs(overUnderBilling) < 500 ? 'balanced' : overUnderBilling > 0 ? 'over_billed' : 'under_billed',
    };
  });
  const totals = {
    contractValue: rows.reduce((s, r) => s + r.contractValue, 0),
    totalCostsToDate: rows.reduce((s, r) => s + r.totalCostsToDate, 0),
    billedToDate: rows.reduce((s, r) => s + r.billedToDate, 0),
    earnedRevenue: rows.reduce((s, r) => s + r.earnedRevenue, 0),
    overUnderBilling: rows.reduce((s, r) => s + r.overUnderBilling, 0),
  };
  res.json({ rows, totals, generatedAt: new Date().toISOString() });
});

app.get('/api/reports/executive-summary', (req, res) => res.json({
  jobs: [
    { jobId: '1', jobNumber: 'JOB-001', jobName: 'Office Renovation', status: 'IN_PROGRESS', estimatedBudget: 150000, totalCosts: 25000, totalLabor: 18500, totalChangeOrders: 7000, totalActual: 50500, variance: 99500, variancePercent: 66.3 },
    { jobId: '2', jobNumber: 'JOB-002', jobName: 'Warehouse Expansion', status: 'PLANNING', estimatedBudget: 280000, totalCosts: 15000, totalLabor: 0, totalChangeOrders: 0, totalActual: 15000, variance: 265000, variancePercent: 94.6 },
    { jobId: '3', jobNumber: 'JOB-003', jobName: 'Retail Store Buildout', status: 'COMPLETED', estimatedBudget: 75000, totalCosts: 8500, totalLabor: 5500, totalChangeOrders: 0, totalActual: 14000, variance: 61000, variancePercent: 81.3 },
  ],
  totals: { estimatedBudget: 505000, totalCosts: 48500, totalLabor: 24000, totalChangeOrders: 7000, totalActual: 79500, revenue: 125000, variance: 45500 },
  generatedAt: new Date().toISOString(),
}));
app.get('/api/reports/profitability', (req, res) => res.json({
  jobs: [
    { jobId: '1', jobName: 'Office Renovation', revenue: 65000, costs: 25000, labor: 18500, grossProfit: 21500, margin: 33.1 },
    { jobId: '2', jobName: 'Warehouse Expansion', revenue: 35000, costs: 15000, labor: 0, grossProfit: 20000, margin: 57.1 },
    { jobId: '3', jobName: 'Retail Store Buildout', revenue: 25000, costs: 8500, labor: 5500, grossProfit: 11000, margin: 44.0 },
  ],
  totals: { revenue: 125000, costs: 48500, labor: 24000, grossProfit: 52500, margin: 42.0 },
}));
app.get('/api/reports/labor-utilization', (req, res) => res.json({
  byWorker: [
    { workerName: 'John Smith', totalHours: 8, travelHours: 0.5, totalCost: 360, entriesCount: 1 },
    { workerName: 'Jane Doe', totalHours: 6, travelHours: 1, totalCost: 300, entriesCount: 1 },
  ],
  totals: { workersCount: 2, totalHours: 14, travelHours: 1.5, totalCost: 660 },
}));
app.get('/api/reports/cash-flow', (req, res) => res.json({
  summary: { totalInflows: 125000, totalOutflows: 79500, netCashFlow: 45500 },
  generatedAt: new Date().toISOString(),
}));


// Job Statuses — fully customizable, stored in-memory
let jobStatuses = [
  { id: '1', value: 'DRAFT',     label: 'Draft',     color: '#6b7280', order: 0 },
  { id: '2', value: 'ACTIVE',    label: 'Active',    color: '#3b82f6', order: 1 },
  { id: '3', value: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b', order: 2 },
  { id: '4', value: 'ON_HOLD',   label: 'On Hold',   color: '#f59e0b', order: 3 },
  { id: '5', value: 'COMPLETED', label: 'Completed', color: '#10b981', order: 4 },
  { id: '6', value: 'CANCELLED', label: 'Cancelled', color: '#ef4444', order: 5 },
];
app.get('/api/settings/job-statuses', (req, res) => {
  res.json([...jobStatuses].sort((a, b) => a.order - b.order));
});
app.post('/api/settings/job-statuses', (req, res) => {
  const { label, color } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const value = label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  const newStatus = {
    id: String(Date.now()),
    value,
    label,
    color: color || '#6b7280',
    order: jobStatuses.length,
  };
  jobStatuses.push(newStatus);
  res.status(201).json(newStatus);
});
app.put('/api/settings/job-statuses/:id', (req, res) => {
  const idx = jobStatuses.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  jobStatuses[idx] = { ...jobStatuses[idx], ...req.body, id: req.params.id };
  res.json(jobStatuses[idx]);
});
app.delete('/api/settings/job-statuses/:id', (req, res) => {
  const idx = jobStatuses.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  jobStatuses.splice(idx, 1);
  res.status(204).end();
});
app.put('/api/settings/job-statuses', (req, res) => {
  // Reorder: accepts full array with updated `order` values
  if (Array.isArray(req.body)) {
    jobStatuses = req.body.map((s, i) => ({ ...s, order: i }));
  }
  res.json(jobStatuses);
});

// Catch-all for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Demo Server] Running on port ${PORT}`);
  console.log(`[Demo Server] Health: http://localhost:${PORT}/api/health`);
});
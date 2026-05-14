import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Vercel Serverless Entry Point ───────────────────────────────────────────
// Imports the pre-compiled Express app from the backend dist folder.
// The backend is compiled during vercel-build before this function runs.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../job-costing-app/backend/dist/serverless').default;

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }
  return app(req as any, res as any);
}

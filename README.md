# Job Costing App — Deployment Guide

## Quick Deploy to Render (recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Or manually:

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically and creates both services
5. **Set your Gemini API key** (see step below — required for AI onboarding)

---

## Setting the Gemini API Key

After the initial deploy, you **must** set the API key manually:

1. In the Render dashboard, open the **job-costing-api** service
2. Go to **Environment**
3. Set `GEMINI_API_KEY` = your key from [aistudio.google.com](https://aistudio.google.com)
4. Click **Save Changes** — Render will redeploy automatically

> ⚠️ Never commit your API key to the repository. The `.env` file is in `.gitignore`.

---

## Services deployed

| Service | Type | URL |
|---|---|---|
| `job-costing-api` | Node.js web service | `https://job-costing-api.onrender.com` |
| `job-costing-app` | Static site (Vite) | `https://job-costing-app.onrender.com` |

> Free tier services spin down after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## Local Development

```bash
# Backend
cd job-costing-app/backend
cp .env.example .env      # then fill in your GEMINI_API_KEY
node demo-server.mjs

# Frontend (new terminal)
cd job-costing-app/frontend
npm install
npm run dev               # → http://localhost:5173
```

---

## Environment Variables

### Backend (`job-costing-app/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI onboarding |
| `JWT_SECRET` | Production | Secret for JWT signing (auto-generated on Render) |
| `PORT` | No | Server port (default: 3001, Render sets automatically) |
| `DATABASE_URL` | Production DB | Supabase/PostgreSQL connection string |
| `DIRECT_URL` | Production DB | Supabase direct connection (for migrations) |

### Frontend (`job-costing-app/frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL in production (auto-set by Render from backend service) |

---

## Architecture Notes

- **Demo mode**: Uses an in-memory Express server (`demo-server.mjs`). All data resets on server restart. Suitable for demos.
- **Production mode**: Switch to the real TypeScript backend (`src/`) with Prisma + Supabase PostgreSQL. See `backend/prisma/schema.prisma`.
- **Multi-tenancy**: Every database query is scoped by `organizationId`. Each registered company is fully isolated.
- **AI Onboarding**: Gemini 2.5 Flash generates industry-specific job templates, cost categories, and demo data on first login.

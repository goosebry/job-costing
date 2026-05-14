# Test Plan — Job Costing Application (Phase 2)

**Stack:** React/Vite frontend + Express/TypeScript backend (demo-server.mjs) + PostgreSQL  
**Paths:** `job-costing-app/frontend/` (Vite + React + Next.js App Router) + `job-costing-app/backend/` (Express/Node.js demo server)  
**Package manager:** npm | **Test runner:** None pre-configured (will script with run_shell/node)  
**Database:** In-memory demo data (no PostgreSQL required for demo mode)  
**Sandbox:** Backend on `:PORT` (health at `/api/health`), Frontend Vite on `:PORT` (health at `/`)  

---

## Phase 1 — Static Analysis

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| STATIC-01 | Static Analysis | Backend TypeScript compiles with 0 errors | `node_modules` installed in backend | `cd job-costing-app/backend && npx tsc --noEmit` | Exit 0, no output |
| STATIC-02 | Static Analysis | Frontend TypeScript compiles with 0 errors | `node_modules` installed in frontend | `cd job-costing-app/frontend && npx tsc --noEmit` | Exit 0, no output |
| STATIC-03 | Static Analysis | Backend ESLint passes with 0 warnings | `node_modules` installed in backend | `cd job-costing-app/backend && npm run lint` | Exit 0, no warnings |
| STATIC-04 | Static Analysis | Frontend ESLint passes with 0 warnings | `node_modules` installed in frontend | `cd job-costing-app/frontend && npm run lint` | Exit 0, no warnings |

---

## Phase 2 — Process Readiness

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| READY-01 | Process Readiness | Backend process starts and responds to /api/health | Sandbox running, backend process up | `curl -s http://<backend_url>/api/health` | HTTP 200, JSON body with `{status:"ok"}` or similar |
| READY-02 | Process Readiness | Frontend Vite dev server starts and responds on / | Sandbox running, frontend process up | `curl -s http://<frontend_url>/` | HTTP 200, HTML content |
| READY-03 | Process Readiness | Vite proxy targets backend port from sandbox | Sandbox running | `grep -A3 '"proxy"' job-costing-app/frontend/vite.config.ts` | Proxy entry exists, targets backend sandbox URL |
| READY-04 | Process Readiness | Backend demo data loads — jobs endpoint returns array | Sandbox running | `curl -s http://<backend_url>/api/jobs` | HTTP 200, JSON array with at least 3 job objects |

---

## Phase 3 — Unit / Integration Tests

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| UNIT-01 | Unit Tests | Backend has a test suite and tests pass | `node_modules` installed | `cd job-costing-app/backend && npm test 2>&1 || true` | Exit 0 or "no tests found" message |
| UNIT-02 | Unit Tests | Frontend has a test suite and tests pass | `node_modules` installed | `cd job-costing-app/frontend && npm test 2>&1 || true` | Exit 0 or "no tests found" message |

---

## Phase 4 — API Tests

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| API-01 | API | GET /api/health returns 200 | Sandbox running | `curl -s -w "\n%{http_code}" http://<backend_url>/api/health` | 200, body has status field |
| API-02 | API | POST /api/auth/login with valid credentials returns token | Sandbox running | `curl -s -X POST http://<backend_url>/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"Admin123!"}'` | 200, body has `token` field |
| API-03 | API | POST /api/auth/login with invalid credentials returns 401 | Sandbox running | `curl -s -w "\n%{http_code}" -X POST http://<backend_url>/api/auth/login -H "Content-Type: application/json" -d '{"email":"wrong@test.com","password":"wrong"}'` | 401 or 403 |
| API-04 | API | GET /api/jobs returns list of jobs | Sandbox running | `curl -s http://<backend_url>/api/jobs` | 200, JSON array, length ≥ 3 |
| API-05 | API | POST /api/jobs creates a new job | Sandbox running | `curl -s -X POST http://<backend_url>/api/jobs -H "Content-Type: application/json" -d '{"name":"Test Job","client":"Test Client","status":"PLANNING","startDate":"2025-01-01","endDate":"2025-06-01"}'` | 201, body has `id` field |
| API-06 | API | GET /api/budget/:jobId/summary returns budget data | Sandbox running | `curl -s http://<backend_url>/api/budget/1/summary` | 200, body has `allocated`, `spent`, `remaining`, `utilization` fields |
| API-07 | API | POST /api/costs rejects date outside ±90 days past / 30 days future | Sandbox running | `curl -s -w "\n%{http_code}" -X POST http://<backend_url>/api/costs -H "Content-Type: application/json" -d '{"jobId":"1","category":"materials","amount":100,"date":"2010-01-01","description":"test"}'` | 400 or 422, error message about date range |
| API-08 | API | POST /api/labor accepts entry with travelHours field | Sandbox running | `curl -s -X POST http://<backend_url>/api/labor -H "Content-Type: application/json" -d '{"jobId":"1","workerName":"Test Worker","hours":8,"travelHours":2,"hourlyRate":50,"date":"2025-03-01"}'` | 200 or 201, travelHours persisted in response |
| API-09 | API | GET /api/notifications/unread/count returns count | Sandbox running | `curl -s http://<backend_url>/api/notifications/unread/count` | 200, body has numeric `count` field |
| API-10 | API | GET /api/reports/profit-loss returns report data | Sandbox running | `curl -s http://<backend_url>/api/reports/profit-loss` | 200, body is an array or object with financial fields |

---

## Phase 5 — UI / Browser Tests

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| UI-01 | UI/Browser | Login page renders with email + password fields and submit button | Sandbox running, frontend up | Navigate to `/login` → snapshot | Email field, password field, submit button visible |
| UI-02 | UI/Browser | Login form accepts credentials and redirects on success | UI-01 complete, sandbox running | Fill email `admin@test.com` / password `Admin123!` → click submit → wait | Redirect away from /login, no error banner visible |
| UI-03 | UI/Browser | Login shows error message on wrong credentials | UI-01 complete, sandbox running | Fill email `bad@test.com` / password `wrong` → click submit → wait | Error message visible on page |
| UI-04 | UI/Browser | Dashboard loads and shows metrics cards (KPI widgets) | UI-02 complete (logged in) | Navigate to `/dashboard` → wait for load → snapshot + screenshot | Jobs count, budget summary, or KPI cards visible |
| UI-05 | UI/Browser | Jobs list page renders with at least one job row | UI-02 complete (logged in) | Navigate to `/jobs` → wait → snapshot + screenshot | Table or card list with job entries |
| UI-06 | UI/Browser | Jobs list shows cost/variance color coding (green/yellow/red) | UI-05 complete | From jobs list, inspect cost columns if visible | Variance cells show colour (green ≤50%, yellow 50-75%, red ≥75%) |
| UI-07 | UI/Browser | Job template selector visible on new job form | UI-02 complete (logged in) | Navigate to `/jobs/new` → snapshot + screenshot | Template dropdown or card selector (Contractor, Real Estate, Manufacturer) |
| UI-08 | UI/Browser | New cost entry form validates date range (±90d past / 30d future) | UI-02 complete (logged in) | Navigate to `/costs/new` → enter date `2010-01-01` → submit → wait | Validation error shown (date out of range) |
| UI-09 | UI/Browser | Labor entry form has travelHours field | UI-02 complete (logged in) | Navigate to `/labor/new` → snapshot | `travelHours` field visible in form |
| UI-10 | UI/Browser | Budget summary page shows allocated/spent/remaining/ utilisation | UI-02 complete (logged in) | Navigate to `/budgets` → wait → snapshot + screenshot | Budget table or cards with allocated, spent, remaining, utilization % |
| UI-11 | UI/Browser | Change orders list shows status badges (PENDING/APPROVED) | UI-02 complete (logged in) | Navigate to `/change-orders` → wait → snapshot + screenshot | Change order list with status badges |
| UI-12 | UI/Browser | Invoices page shows invoice list with status | UI-02 complete (logged in) | Navigate to `/invoices` → wait → snapshot + screenshot | Invoice table with status column (DRAFT/SENT/PAID) |
| UI-13 | UI/Browser | Reports page shows report navigation/options | UI-02 complete (logged in) | Navigate to `/reports` → wait → snapshot + screenshot | Report links or tabs (P&L, Labor Utilization, WIP, Cost-to-Date) |
| UI-14 | UI/Browser | Settings page renders role/permission info or form | UI-02 complete (logged in) | Navigate to `/settings` → wait → snapshot + screenshot | Settings form or RBAC display |
| UI-15 | UI/Browser | Notification bell shows unread count badge | UI-02 complete (logged in) | Navigate to `/dashboard` → find notification bell → snapshot | Bell icon with badge showing count |

---

## Phase 6 — Browser Console Health

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| CONSOLE-01 | Console Health | No JS errors on login page load | Sandbox running, frontend up | Navigate to `/login` → inject error interceptor → wait 2s → evaluate `window.__qaErrors` | `__qaErrors` is empty array |
| CONSOLE-02 | Console Health | No JS errors on dashboard load | UI-02 complete (logged in) | Navigate to `/dashboard` → inject error interceptor → wait 2s → evaluate `window.__qaErrors` | `__qaErrors` is empty array |
| CONSOLE-03 | Console Health | No JS errors on jobs list page | UI-02 complete (logged in) | Navigate to `/jobs` → inject error interceptor → wait 2s → evaluate `window.__qaErrors` | `__qaErrors` is empty array |
| CONSOLE-04 | Console Health | No JS errors after login form submission | UI-02 complete (logged in) | Navigate to `/login` → inject error interceptor → submit valid form → wait → evaluate `window.__qaErrors` | `__qaErrors` is empty array |

---

## Phase 7 — Network Request Verification

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| NET-01 | Network | POST /api/auth/login sends correct URL, method, payload | Sandbox running, frontend up | Inject fetch interceptor → submit login form → evaluate `window.__qaRequests` | Request URL matches backend, method POST, body has email+password |
| NET-02 | Network | GET /api/jobs fires on jobs page load | UI-02 complete (logged in) | Navigate to `/jobs` → intercept → evaluate `window.__qaRequests` | `/api/jobs` GET request present in captured requests |
| NET-03 | Network | POST /api/costs sends correct shape (jobId, category, amount, date) | UI-02 complete (logged in) | Navigate to `/costs/new` → intercept → submit cost form → evaluate `window.__qaRequests` | POST to `/api/costs` with JSON body containing jobId, category, amount, date fields |

---

## Phase 8 — Responsive / Viewport Testing

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| VIEWPORT-01 | Responsive | App renders correctly on mobile 375×812 | Sandbox running | Resize to 375×812 → navigate to `/dashboard` → wait → screenshot → visual_inspect | Nav collapses, content stacks vertically, no horizontal overflow |
| VIEWPORT-02 | Responsive | App renders correctly on tablet 768×1024 | Sandbox running | Resize to 768×1024 → navigate to `/dashboard` → wait → screenshot → visual_inspect | 2-column or adaptive layout, no overlap |
| VIEWPORT-03 | Responsive | App renders correctly on desktop 1440×900 | Sandbox running | Resize to 1440×900 → navigate to `/dashboard` → wait → screenshot → visual_inspect | Full 3-column layout, sidebar visible, no overflow |

---

## Phase 9 — Accessibility

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| A11Y-01 | Accessibility | Login page has no critical/serious axe-core violations | Sandbox running, frontend up | Load `/login` → inject axe-core CDN → run axe → capture violations | 0 critical + 0 serious violations |
| A11Y-02 | Accessibility | Dashboard has no critical/serious axe-core violations | UI-02 complete (logged in) | Load `/dashboard` → inject axe-core → run axe → capture violations | 0 critical + 0 serious violations |
| A11Y-03 | Accessibility | All form inputs have associated labels | Sandbox running, frontend up | Navigate to `/login` → snapshot | Every `<input>` has a `<label htmlFor>` or `aria-label` |
| A11Y-04 | Accessibility | Colour is not the only means of conveying information (WCAG 1.4.1) | UI-02 complete (logged in) | Navigate to `/jobs` → snapshot | Variance colour coding has text/ARIA fallback, not colour-alone |

---

## Phase 10 — Log Inspection

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| LOG-01 | Log Inspection | Backend log has no ERROR/EXCEPTION entries after startup | Sandbox running | `sandbox(action="tail_logs", workspace=..., process="backend", n=200)` → grep -i "error\|exception\|panic" | 0 error/exception lines in tail |
| LOG-02 | Log Inspection | Frontend Vite dev server log has no errors after startup | Sandbox running | `sandbox(action="tail_logs", workspace=..., process="frontend", n=200)` → grep -i "error" | 0 error lines in Vite output |

---

## Phase 11 — Database State Verification

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| DB-01 | Database | Backend schema has all required tables defined in Prisma | `prisma/schema.prisma` exists | `cat prisma/schema.prisma` | `model Job`, `model Cost`, `model Labor`, `model Budget`, `model Invoice`, `model User`, `model Role`, `model Permission` present |
| DB-02 | Database | RLS policies are defined in migration files | `db/migrations/` exists | `ls db/migrations/` | At least `001_initial_schema.sql`, `002_rls_policies.sql` present |
| DB-03 | Database | Demo data seeds jobs, users, and costs | demo-server.mjs loads demo data | `curl -s http://<backend_url>/api/jobs` | Array with 3+ jobs, each with id, name, status, startDate |
| DB-04 | Database | Date validation constraints are enforced at API layer | sandbox running | POST `/api/costs` with date `2010-01-01` → check response code | 400 or 422 returned |

---

## Phase 12 — User Journeys

| ID | Type | Description | Preconditions | Steps | Expected Result |
|----|------|-------------|---------------|-------|-----------------|
| J01-TC1 | User Journey | Guest can browse the app — login page accessible | Sandbox running | Navigate to `/` → wait → snapshot | Redirect to /login or landing page shown |
| J01-TC2 | User Journey | User logs in with valid credentials | Sandbox running | Navigate to `/login` → fill form → submit → wait | Redirect to /dashboard, nav bar visible |
| J01-TC3 | User Journey | PM creates a new job from template | J01-TC2 complete (logged in) | Navigate to `/jobs/new` → select template → fill name "Renovation PM Test" → submit → wait | Redirect to job detail or jobs list, new job appears |
| J01-TC4 | User Journey | Cost accountant adds a material cost to a job | J01-TC3 complete | Navigate to `/costs/new` → select job → category "materials" → amount 500 → date today → submit → wait | Success message, cost appears in job budget |
| J01-TC5 | User Journey | Field worker enters labor with travel hours | J01-TC2 complete (logged in) | Navigate to `/labor/new` → select job → worker "Bob" → hours 8 → travelHours 1.5 → submit → wait | Success, labor entry saved with travel time |
| J01-TC6 | User Journey | Approver reviews and approves a pending change order | J01-TC2 complete (logged in) | Navigate to `/approvals` or `/change-orders` → find pending CO → click approve → wait | CO status changes to APPROVED, notification triggered |
| J01-TC7 | User Journey | Admin sends an invoice (SENT status) | J01-TC2 complete (logged in) | Navigate to `/invoices` → find draft invoice → click Send/Create → wait | Invoice status changes to SENT |
| J01-TC8 | User Journey | User generates the P&L report | J01-TC2 complete (logged in) | Navigate to `/reports` → click "Profit & Loss" → wait for load | Report data/table renders |
| J01-TC9 | User Journey | Notification bell shows budget alert notification | J01-TC2 complete (logged in) | Navigate to `/dashboard` → check notification bell → snapshot + screenshot | Bell badge shows count > 0, clicking opens notification list |
| J01-TC10 | User Journey | User navigates back mid-flow (no double-submit) | J01-TC2 complete (logged in) | Start cost entry → fill form → click browser Back → navigate forward → snapshot | No duplicate cost entry, form not stuck |
| J01-TC11 | User Journey | Direct URL manipulation — accessing /jobs without auth redirects to /login | Not logged in (fresh browser) | Open new browser context → navigate directly to `/jobs` → wait | Redirect to `/login`, then after login back to /jobs or dashboard |

---

## Coverage Table

| Functional Spec Feature | Test Case ID(s) |
|------------------------|-----------------|
| Multi-tenant isolation | DB-02 (RLS policies defined) |
| RBAC with 4 roles | API-02 (login returns token), A11Y-03 (form labels) |
| Job templates (Contractor/Real Estate/Manufacturer) | UI-07 (template selector visible), J01-TC3 (create from template) |
| 5 cost categories with budget variance | UI-06 (variance colours), UI-10 (budget summary), API-06 (budget summary API) |
| Labor entry with travel hours | UI-09 (travelHours field), API-08 (travel hours accepted), J01-TC5 (labor entry flow) |
| Change order workflow (PENDING→APPROVED) | UI-11 (status badges), J01-TC6 (approve change order) |
| Invoice generation (DRAFT→SENT→PAID) | UI-12 (invoice list), J01-TC7 (send invoice) |
| Stripe integration | UI-12 (Stripe-invoiced flow), API-10 (reports endpoint) |
| 5 reports + PDF/Excel export | UI-13 (reports page), API-10 (profit-loss report), J01-TC8 (P&L report) |
| Date validation ±90d past / 30d future | API-07 (date rejection), UI-08 (date validation UI) |
| Notification system | UI-15 (bell badge), API-09 (unread count), J01-TC9 (budget alert notification) |
| Offline mode (Service Worker + IndexedDB) | Not verifiable in browser without extended setup — covered by static inspection only |
| Auth login/logout | API-02, API-03, UI-02, UI-03, J01-TC1, J01-TC2 |
| Job CRUD | API-04, API-05, UI-05, J01-TC3 |

---

**Total test cases: 69**
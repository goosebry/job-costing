| **Backend Hosting** | AWS EC2 (or ECS Fargate) | Containerized deployments, auto-scaling |
| **Database** | AWS RDS PostgreSQL | Managed, automatic backups, Multi-AZ |
| **File Storage** | AWS S3 | Attachments, reports |
| **CDN** | AWS CloudFront | Static assets, caching |
| **Cache** | AWS ElastiCache (Redis) | Sessions, WebSocket pub/sub |
| **Secrets** | AWS Secrets Manager | API keys, database credentials |
| **CI/CD** | GitHub Actions | GitOps, automated testing |
| **Monitoring** | Datadog APM + Logs | Performance monitoring, alerting |
| **Error Tracking** | Sentry | Frontend/backend error tracking |

---

## 9. cursor_build-ready Implementation Tasks

### 9.1 Database & Migrations

| Task ID | File/Path | Description | AC Reference |
|---------|-----------|-------------|--------------|
| DB-01 | `job_costing_db/migrations/001_initial_schema.sql` | Create all tables with UUID primary keys, constraints, and indexes | AC-1 |
| DB-02 | `job_costing_db/migrations/002_rls_policies.sql` | Enable RLS and create org_isolation_policy on all tables | AC-1 |
| DB-03 | `job_costing_db/migrations/003_system_roles.sql` | Insert default roles (Admin, PM, Cost Accountant, Field Worker) with permissions | AC-2 |
| DB-04 | `job_costing_db/migrations/004_job_templates.sql` | Insert default job templates (Contractor, Real Estate, Manufacturer) | AC-3 |
| DB-05 | `job_costing_db/migrations/005_cost_categories.sql` | Insert 5 default cost categories per functional spec | AC-4 |

### 9.2 Backend API Implementation

| Task ID | File/Path | Description | AC Reference |
|---------|-----------|-------------|--------------|
| API-01 | `backend/src/modules/auth/auth.controller.ts` | POST /auth/login, /auth/refresh, /auth/logout endpoints | - |
| API-02 | `backend/src/modules/auth/auth.service.ts` | JWT issuance (24hr), bcrypt verification (cost 12), refresh rotation | - |
| API-03 | `backend/src/middleware/auth.middleware.ts` | JWT verification, org context setting, RLS policy activation | AC-1 |
| API-04 | `backend/src/middleware/rbac.middleware.ts` | checkPermission() middleware for 16 permissions | AC-2 |
| API-05 | `backend/src/modules/jobs/jobs.controller.ts` | CRUD endpoints for jobs, template application | AC-3 |
| API-06 | `backend/src/modules/costs/costs.controller.ts` | POST /costs with 90-day past/30-day future validation | AC-4, AC-5 |
| API-07 | `backend/src/modules/labor/labor.controller.ts` | POST /labor with hours_worked + hours_travel computation | AC-5 |
| API-08 | `backend/src/modules/budget/budget.controller.ts` | GET /budgets/:jobId/variance with threshold colors | AC-4 |
| API-09 | `backend/src/modules/change-orders/change-orders.controller.ts` | POST /change-orders with approval workflow, committed column | AC-6 |
| API-10 | `backend/src/modules/invoices/invoices.controller.ts` | Invoice generation from entries, Stripe checkout | AC-7, AC-8 |
| API-11 | `backend/src/modules/stripe/stripe.controller.ts` | Webhook handler for checkout.session.completed, payment_intent events | AC-8 |
| API-12 | `backend/src/modules/reports/reports.controller.ts` | 5 report endpoints with PDF/Excel export | AC-9 |
| API-13 | `backend/src/modules/notifications/notifications.controller.ts` | GET /notifications, WebSocket /ws/notifications | - |

### 9.3 Frontend Implementation

| Task ID | File/Path | Description | AC Reference |
|---------|-----------|-------------|--------------|
| FE-01 | `frontend/src/components/providers/AuthProvider.tsx` | JWT handling, login/logout, session refresh | - |
| FE-02 | `frontend/src/components/layout/AppShell.tsx` | Sidebar navigation, notification bell, layout | SCR-02 |
| FE-03 | `frontend/src/pages/login.tsx` | SCR-01: Email/password form, remember me, forgot password | - |
| FE-04 | `frontend/src/pages/dashboard.tsx` | SCR-02: Metric cards, activity feed, quick actions | - |
| FE-05 | `frontend/src/pages/jobs/index.tsx` | SCR-03: Table with search, filters, pagination | - |
| FE-06 | `frontend/src/pages/jobs/new.tsx` | SCR-04: Template selection, tabbed form | AC-3 |
| FE-07 | `frontend/src/pages/jobs/[id].tsx` | SCR-14: Summary cards, tabbed content | - |
| FE-08 | `frontend/src/components/costs/CostEntryModal.tsx` | SCR-05: Slide-out modal, cost code selection, attachment upload | AC-4 |
| FE-09 | `frontend/src/components/labor/LaborEntryForm.tsx` | SCR-06: Timesheet grid, travel hours field | AC-5 |
| FE-10 | `frontend/src/pages/budgets.tsx` | SCR-07: Variance cards with green/yellow/red color coding | AC-4 |
| FE-11 | `frontend/src/pages/change-orders.tsx` | SCR-08: Split view, approval chain, impact analysis | AC-6 |
| FE-12 | `frontend/src/pages/invoices.tsx` | SCR-09: Status tabs, Stripe "Pay Now" button | AC-7, AC-8 |
| FE-13 | `frontend/src/pages/reports.tsx` | SCR-10: Report type tabs, PDF/Excel export buttons | AC-9 |
| FE-14 | `frontend/src/components/notifications/NotificationPanel.tsx` | SCR-11: Dropdown panel, real-time updates via WebSocket | - |
| FE-15 | `frontend/src/pages/approvals.tsx` | SCR-12: Approve/reject interface for PM/Admin | AC-2 |
| FE-16 | `frontend/src/pages/settings.tsx` | SCR-13: Tabbed settings (Organization, Cost Categories, Users, Roles, Stripe) | - |
| FE-17 | `frontend/src/hooks/usePermission.ts` | React hook for permission-based UI rendering | AC-2 |
| FE-18 | `frontend/src/offline/sync.ts` | Service Worker, IndexedDB (Dexie.js), background sync | AC-10 |

---

## 10. Error Handling Strategy

### 10.1 API Error Response Format

```typescript
// Standard error response
interface ErrorResponse {
  error: string;      // Machine-readable error code (e.g., "VALIDATION_ERROR")
  message: string;    // Human-readable message
  field?: string;     // Field name (for validation errors)
  details?: object;   // Additional context
  requestId: string;  // For log correlation
}

// HTTP Status Codes
const HTTP_STATUS = {
  BAD_REQUEST: 400,           // VALIDATION_ERROR, INVALID_INPUT
  UNAUTHORIZED: 401,          // Token expired, invalid credentials
  FORBIDDEN: 403,             // Permission denied
  NOT_FOUND: 404,             // Resource not found
  CONFLICT: 409,              // DUPLICATE_ENTRY, CONCURRENT_MODIFICATION
  UNPROCESSABLE_ENTITY: 422, // BUSINESS_RULE_VIOLATION
  INTERNAL_SERVER_ERROR: 500, // Unexpected errors
};
```

### 10.2 Client-Side Error Boundaries

```typescript
// React error boundary
class APIErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

### 10.3 Retry Policies

```typescript
// Transient failure retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'NETWORK_ERROR',
  ],
};

// TanStack Query retry config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
```

---

## 11. Acceptance Criteria Mapping

| AC | Requirement | Implementation Tasks |
|----|-------------|---------------------|
| AC-1 | Multi-tenant isolation verified | DB-02 (RLS policies), API-03 (org context middleware) |
| AC-2 | RBAC functional across all roles | API-04 (RBAC middleware), FE-17 (usePermission hook), FE-15 (approvals page) |
| AC-3 | Job templates operational | DB-04 (templates data), FE-06 (template selection UI) |
| AC-4 | All 5 cost categories tracked | DB-05 (categories data), API-06 (cost endpoints), FE-08 (cost modal), FE-10 (budget page) |
| AC-5 | Labor entry with separate travel time | API-07 (labor with hours_travel), FE-09 (labor form) |
| AC-6 | Change order amendments working | API-09 (change orders with workflow), FE-11 (change orders page) |
| AC-7 | Invoice generation from entries | API-10 (invoice from entries), FE-12 (invoices page) |
| AC-8 | Stripe integration end-to-end | API-10 (checkout), API-11 (webhook), FE-12 (pay now) |
| AC-9 | All 5 reports available/exportable | API-12 (5 reports), FE-13 (reports page) |
| AC-10 | Offline mode with sync | FE-18 (Service Worker + IndexedDB) |

---

## Appendix A: Performance Requirements

| Metric | Target | Implementation |
|--------|--------|----------------|
| Page load | <3s | Next.js SSR, CloudFront CDN, code splitting |
| API response | <500ms p95 | PostgreSQL indexes, connection pooling, Redis cache |
| Report generation | <10s for 10k records | Read replicas, query optimization, background processing |
| WebSocket latency | <100ms | Redis pub/sub, connection pooling |

## Appendix B: Security Checklist

- [ ] bcrypt cost factor 12 for password hashing
- [ ] JWT 24-hour expiry with refresh token rotation
- [ ] HTTPS enforced at load balancer level
- [ ] CORS restricted to frontend origin
- [ ] PostgreSQL RLS for multi-tenant isolation
- [ ] API rate limiting per user/IP
- [ ] Input validation with Zod schemas
- [ ] SQL injection prevention via parameterized queries (Prisma)
- [ ] XSS prevention via React's default escaping
- [ ] CSRF protection via SameSite cookies
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Audit log for sensitive operations

## Appendix C: File Structure

```
job_costing_app/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── jobs/
│   │   │   ├── costs/
│   │   │   ├── labor/
│   │   │   ├── budget/
│   │   │   ├── change-orders/
│   │   │   ├── invoices/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   └── stripe/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── costs/
│   │   │   ├── labor/
│   │   │   └── notifications/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── offline/
│   │   └── stores/
│   ├── public/
│   │   └── sw.js (Service Worker)
│   └── package.json
└── job_costing_db/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_rls_policies.sql
        ├── 003_system_roles.sql
        ├── 004_job_templates.sql
        └── 005_cost_categories.sql
```

---

**Document Status:** ✅ READY FOR IMPLEMENTATION

This design specification provides a complete blueprint for the Job Costing Application. All acceptance criteria from `functional.md` are mapped to specific implementation tasks. The developer can begin implementation immediately using the cursor_build-ready tasks defined above.

---

## Cursor Session
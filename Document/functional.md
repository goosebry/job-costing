## 5. Data Model

### 5.1 Core Entities

#### Organization (Tenant)
- `id` (UUID, PK)
- `name`, `address`, `contact_email`
- `created_at`, `updated_at`
- `stripe_account_id` (for payment integration)
- `settings` (JSON: fiscal year start, currency, date format)

#### User
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `email`, `password_hash`, `first_name`, `last_name`
- `role_id` (FK → Role)
- `is_active`, `last_login`
- `created_at`, `updated_at`

#### Role
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `name` (string; system roles: Admin, Project Manager, Cost Accountant, Field Worker; others user-defined)
- `is_system_role` (boolean)
- `permissions` (JSON: granular permission map per feature area)
- `created_at`, `updated_at`

#### Job
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `job_number` (auto-increment per org, string)
- `name`, `description`
- `status` (FK → JobStatus)
- `template_id` (FK → JobTemplate, nullable)
- `client_name`, `client_contact`
- `start_date`, `end_date` (planned)
- `actual_end_date`
- `budget_total` (decimal)
- `created_by` (FK → User)
- `created_at`, `updated_at`

#### JobStatus
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `name` (string)
- `display_order`, `is_terminal`, `is_default`
- `is_system_status` (boolean)

#### JobTemplate
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `name` (Contractor, Real Estate, Manufacturer, or user-defined)
- `default_statuses` (JSON array of status names)
- `default_cost_categories` (JSON array of cost category IDs)
- `created_at`

#### CostCategory
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `name` (Direct Labor, Direct Materials, Subcontract, Equipment/Rental, Overhead/Burden, or user-defined)
- `type` (enum: direct_labor, direct_material, subcontract, equipment, overhead)
- `is_active`, `parent_id` (nullable, FK → CostCategory — for subcategories such as travel time)
- `created_at`

#### CostCode
- `id` (UUID, PK)
- `organization_id` (FK → Organization)
- `code` (string), `name`, `description`
- `cost_category_id` (FK → CostCategory)
- `is_active`, `created_at`

#### CostEntry
- `id` (UUID, PK)
- `job_id` (FK → Job)
- `cost_category_id` (FK → CostCategory)
- `cost_code_id` (FK → CostCode, nullable)
- `amount` (decimal)
- `entry_date`, `description`
- `created_by` (FK → User)
- `created_at`, `updated_at`
- `attachments` (JSON array of file references)

#### LaborEntry
- `id` (UUID, PK)
- `job_id` (FK → Job)
- `user_id` (FK → User — the worker)
- `work_date`
- `hours_worked` (decimal)
- `hours_travel` (decimal — travel time subcategory)
- `hourly_rate` (decimal) or `lump_sum` (decimal, nullable — mutually exclusive)
- `amount` (computed: (hours_worked + hours_travel) × hourly_rate, or lump_sum)
- `description`
- `status` (draft, submitted, approved)
- `created_at`, `updated_at`

#### BudgetLine
- `id` (UUID, PK)
- `job_id` (FK → Job)
- `cost_category_id` (FK → CostCategory)
- `cost_code_id` (FK → CostCode, nullable)
- `budget_amount` (decimal)
- `created_at`, `updated_at`

#### ChangeOrder
- `id` (UUID, PK)
- `job_id` (FK → Job)
- `change_order_number` (auto-increment per job)
- `title`, `description`
- `amount_change` (decimal — positive for increase, negative for decrease)
- `status` (pending, approved, rejected)
- `submitted_by` (FK → User)
- `approved_by` (FK → User, nullable)
- `approved_at`
- `created_at`, `updated_at`

#### ChangeOrderLine
- `id` (UUID, PK)
- `change_order_id` (FK → ChangeOrder)
- `budget_line_id` (FK → BudgetLine)
- `amount_adjustment` (decimal)

#### Invoice
- `id` (UUID, PK)
- `job_id` (FK → Job)
- `invoice_number` (auto-increment per org)
- `status` (draft, sent, paid, void)
- `line_items` (JSON array: cost_category, description, amount)
- `subtotal`, `tax`, `total`
- `due_date`
- `stripe_invoice_id` (nullable)
- `created_by` (FK → User)
- `created_at`, `updated_at`

#### Notification
- `id` (UUID, PK)
- `user_id` (FK → User)
- `type` (budget_alert, change_order, job_status, overdue_entry)
- `title`, `message`
- `is_read`, `read_at`
- `created_at`

### 5.2 Data Relationships

```
Organization
  ├── User (many)
  ├── Role (many)
  ├── Job (many)
  │     ├── CostEntry (many)
  │     ├── LaborEntry (many)
  │     ├── BudgetLine (many)
  │     ├── ChangeOrder (many)
  │     │     └── ChangeOrderLine (many)
  │     └── Invoice (many)
  ├── CostCategory (many, self-referential for subcategories)
  ├── CostCode (many)
  └── JobTemplate (many)
```

### 5.3 Multi-Tenant Isolation

- Every database query must include `organization_id` as a filter condition
- Row-level security (RLS) enforced at the PostgreSQL level
- API layer validates tenant ownership before returning data
- No cross-tenant data access is permitted under any circumstances

---

## 6. Feature Specifications

### 6.1 Job Management

#### 6.1.1 Job Creation
- Users select a **JobTemplate** (Contractor, Real Estate, Manufacturer, or custom) when creating a job
- Templates pre-populate the job with default statuses, cost categories, and budget structure
- Job numbers are auto-generated sequentially per organization (`ORG-001`, `ORG-002`, …)
- Jobs start in the first non-terminal status defined by the template

#### 6.1.2 Job Lifecycle States
- Each organization has a set of **JobStatus** records defining their workflow
- System-defined templates include states: **Draft → Active → Completed → Closed**
- Organizations can add, remove, reorder, or rename statuses via the Admin panel
- Terminal states (`is_terminal = true`) end the workflow (e.g., Closed, Cancelled)
- Only users with `job_status_transition` permission can change job status
- Status transitions are logged with: user, timestamp, from-status, to-status

#### 6.1.3 Job Dashboard
- Dashboard displays all jobs in a filterable table: by status, date range, template, assigned user
- Quick stats cards: total active jobs, total budgeted, total spent, total WIP
- Click-through to job detail view

#### 6.1.4 Key States (Job Detail View)
- **Empty**: No cost entries yet — shows budget lines with $0 spent, call-to-action to add first entry
- **Loading**: Skeleton loader for cost summary cards and entry list
- **Error**: Error banner with retry button if API call fails
- **Populated**: Full cost breakdown by category, budget vs. actuals bars, quick-add buttons

---

### 6.2 Cost Entry

#### 6.2.1 Cost Entry Form
- Fields: Job (auto-filled if navigated from job context), Cost Category (dropdown), Cost Code (optional, filtered by category), Amount, Date, Description, Attachments (file upload)
- Amount validation: must be > 0, max 2 decimal places
- Date validation: cannot be more than 90 days in the past or more than 30 days in the future
- On save: entry is recorded with `created_by` timestamp

#### 6.2.2 Cost Entry List (Job Detail)
- Sortable by date, category, amount, user
- Filterable by category, date range, user
- Inline edit capability for users with `cost_entry_edit` permission
- Delete with confirmation modal for users with `cost_entry_delete` permission
- Running total displayed at bottom

#### 6.2.3 Cost Allocation
- Each cost entry is allocated to exactly one CostCategory and optionally one CostCode
- CostCodes are optional but recommended for granular tracking within a category
- Support for splitting a cost across multiple categories (multiple entries from one source receipt)

#### 6.2.4 Key States (Cost Entry List)
- **Empty**: "No cost entries yet" message with "Add First Entry" button
- **Loading**: Row skeleton animation
- **Error**: Inline error message below the list with retry
- **Populated**: Paginated table (25 entries per page), summary row at top

---

### 6.3 Labor Entry

#### 6.3.1 Labor Entry Form
- Fields: Job, Worker (User dropdown, defaults to current user), Work Date, Hours Worked, Hours Travel, Rate (hourly or lump sum), Description
- Hours validation: each must be ≥ 0, max 24 per day combined
- **Hours Travel** is a required field (defaults to 0) — travel time is tracked separately per requirement
- Rate validation: must be ≥ 0
- Amount is computed: `(hours_worked + hours_travel) × hourly_rate` OR `lump_sum` if hourly rate is 0
- Submission flow: Draft → Submitted → Approved (by Project Manager or Admin)

#### 6.3.2 Labor Entry List (Job Detail)
- Grouped by worker, sorted by date
- Summary row per worker: total hours worked, total hours travel, total amount
- Approval status badge per entry
- Approve/Reject actions for authorized users

#### 6.3.3 Key States (Labor Entry)
- **Empty**: No timesheet entries — shows "Log Time" quick-action
- **Pending Approval**: Yellow badge, approve/reject buttons visible to approvers
- **Approved**: Green badge, entry is locked from editing
- **Rejected**: Red badge with rejection reason displayed, worker can resubmit

---

### 6.4 Budget Management

#### 6.4.1 Budget Line Configuration
- Per job, admin or PM defines budget lines: each line has a CostCategory, optional CostCode, and budget amount
- Budget lines can be added, edited, or removed before job is set to a terminal status
- Total job budget = sum of all budget line amounts

#### 6.4.2 Budget vs. Actuals View (Job Detail)
- Table: Cost Category | Budgeted | Approved | Committed (pending change orders) | Actual Spent | Variance
- Variance = Budgeted − Actual Spent (negative = over budget)
- Color coding: green ≤ 90% of budget, yellow 90–100%, red > 100%
- Export to CSV / PDF

#### 6.4.3 Budget Alerts
- Alert triggers when actual spending reaches 75%, 90%, and 100% of budget for any cost category
- Alert is sent to job owner and configured watchers
- Alerts are stored in Notification table and sent via email

---

### 6.5 Change Orders

#### 6.5.1 Change Order Creation
- Change order records: title, description, amount change (positive or negative)
- Change order lines map to specific budget lines being amended
- Total change order amount = sum of line adjustments
- New working budget = original budget + sum of all approved change orders

#### 6.5.2 Approval Workflow
- Status: Pending → Approved | Rejected
- Approval authority configurable per organization (by amount threshold)
- Approval records: approved_by, approved_at
- Rejected change orders are retained with rejection reason

#### 6.5.3 Key States (Change Order)
- **Empty**: No change orders — "Submit Change Order" button
- **Pending**: Amber badge, approval actions visible
- **Approved**: Committed amount updated in budget vs. actuals view
- **Rejected**: Red badge, rejection reason shown

---

### 6.6 Invoicing

#### 6.6.1 Invoice Generation
- Invoice is generated from a job's cost entries and labor entries
- User selects which entries to include (default: all approved, unbilled entries)
- Line items: Cost Category, Description, Amount
- Subtotal, optional tax rate, total computed automatically
- Invoice number auto-generated (`INV-ORG-001`, etc.)

#### 6.6.2 Invoice Status Lifecycle
- Draft → Sent → Paid | Void
- Only Draft invoices are editable
- Sent invoices can be voided (creates reversal entry)
- Paid invoices are locked

#### 6.6.3 Stripe Integration
- "Send & Collect Payment" button on Sent invoice creates a Stripe Checkout session
- Stripe checkout URL embedded or linked from invoice view
- Webhook updates invoice status to Paid on successful payment
- Stripe `payment_intent.succeeded` event triggers status update
- Stripe `payment_intent.payment_failed` event creates notification for assigned user
- Admin configures Stripe API keys in organization settings

#### 6.6.4 Key States (Invoice)
- **Draft**: Editable, "Review & Send" button
- **Sent**: View-only, "View in Stripe" button
- **Paid**: Green "Paid" badge, locked
- **Void**: Grey "Void" badge, locked, crossed-out number

---

### 6.7 Reporting

#### 6.7.1 Job P&L Report
- Per-job profit and loss statement
- Revenue (if configured) vs. total costs broken down by category
- Gross margin and margin percentage
- Filterable by job, date range

#### 6.7.2 Cost-to-Date vs Budget Report
- Per-job: Budgeted amount, actual spent to date, variance (amount and %)
- Color-coded variance (green/yellow/red threshold)
- Drill-down by cost category and cost code
- Export to CSV / PDF

#### 6.7.3 Labor Utilization Report
- Per worker or per team: hours logged vs. available capacity (configurable)
- Utilization % = (hours logged / available hours) × 100
- Filterable by date range, worker, job
- Helps identify under-utilized or over-allocated workers

#### 6.7.4 WIP Summary Report
- All active jobs with unbilled costs to date
- Columns: Job Number, Job Name, Total Budget, Cost to Date, Estimated Completion Cost, WIP Value
- Helps financial forecasting and revenue recognition

#### 6.7.5 Job Status Dashboard
- High-level overview: count and value of jobs by status
- Quick stats: total active jobs, total open change orders, jobs approaching budget limit
- Drill-down click-through to individual job views

---

### 6.8 User & Access Management

#### 6.8.1 Authentication
- Email + password authentication
- Password requirements: minimum 8 characters, at least one uppercase, one lowercase, one number
- Password reset via email link (time-limited token)
- Session timeout: 30 minutes of inactivity

#### 6.8.2 Role-Based Access Control (RBAC)
- **Granular permissions** per feature area: job_management, cost_entry, cost_entry_edit, cost_entry_delete, labor_entry, labor_entry_approve, budget_view, budget_edit, change_order_submit, change_order_approve, invoice_generate, invoice_view, report_run, report_export, user_management, role_management, notification_manage
- System roles (Admin, PM, Cost Accountant, Field Worker) are pre-configured
- Custom roles: Admin creates new roles and assigns permissions per checkbox
- Permissions are enforced at both API and UI levels (UI hides unauthorized actions)

#### 6.8.3 Organization Management
- Admin can manage organization settings (name, address, fiscal year, currency)
- Admin can view and manage all users within the organization
- Users can be deactivated (not deleted) to preserve audit trail

---

### 6.9 Data Export

#### 6.9.1 Export Formats
- **CSV**: All tabular report data and cost entry exports
- **PDF**: Formatted reports (Job P&L, WIP Summary, Invoices) with organization branding
- **API**: JSON over REST endpoints for machine-readable consumption

#### 6.9.2 API Architecture
- RESTful API with JSON request/response
- Authentication via Bearer token (JWT)
- Endpoints: `/api/v1/jobs`, `/api/v1/jobs/:id/costs`, `/api/v1/jobs/:id/labor`, `/api/v1/reports`, `/api/v1/invoices`, `/api/v1/users`
- Pagination: cursor-based, default 50 records per page
- Future-ready for QuickBooks/Xero integration via API

---

### 6.10 Notifications and Alerts

#### 6.10.1 Alert Triggers
- Budget threshold reached: 75%, 90%, 100% of budget line amount
- Change order submitted, approved, or rejected
- Job status transitioned
- Labor entry pending approval (reminder to approver)
- Overdue cost entries (no entry logged in 5+ business days on active job)

#### 6.10.2 Delivery Channels
- **In-app notification center**: Bell icon in header, unread count badge
- **Email**: Configurable per user (opt-in/out per alert type)
- Admin can configure organization-wide defaults

#### 6.10.3 Key States (Notification Center)
- **Empty**: "You're all caught up" message
- **Unread**: Bold title, blue dot indicator
- **Read**: Normal weight, no dot

---

## 7. Technical and Non-Functional Requirements

### 7.1 Technology Stack
- **Frontend**: Modern responsive SPA — React/Next.js or Vue/Svelte
- **Backend**: Node.js or Go
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Hosting**: AWS + Vercel (multi-tenant SaaS)
- **Payment Processing**: Stripe Checkout / Payment Intents API
- **Offline Mode**: Service Worker + IndexedDB for local persistence; background sync on reconnect

### 7.2 Cross-Browser Support
- Chrome, Firefox, Safari, Edge — latest two versions each

### 7.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support for forms, tables, and modals
- Sufficient color contrast ratios

### 7.4 Performance
- Page load < 3 seconds for initial load on standard broadband
- API response time < 500ms for p95 under normal load
- Report generation < 10 seconds for up to 10,000 records

### 7.5 Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with 24-hour expiry, refresh token rotation
- HTTPS enforced for all traffic
- Input validation and SQL injection prevention at API layer
- CORS restricted to known origins
- Stripe API keys stored in environment variables, never in source code

---

## 8. Acceptance Criteria

The following acceptance criteria must all pass before the application is considered ready for delivery.

| ID | Criterion | Testable Condition |
|----|-----------|--------------------|
| AC-1 | **Multi-tenant isolation** | Data from one organization is not accessible by any user of another organization; enforced by RLS and API validation |
| AC-2 | **Role/permission framework functional** | Users assigned to Admin, PM, Cost Accountant, Field Worker, and custom roles can only perform actions permitted by their role; unauthorized actions are blocked at API and hidden in UI |
| AC-3 | **Job lifecycle templates operational** | Jobs can be created from Contractor, Real Estate, and Manufacturer templates; custom templates can be created and edited; status transitions follow template-defined flow |
| AC-4 | **All cost categories tracked** | Direct Labor, Direct Materials, Subcontract, Equipment/Rental, and Overhead/Burden are available as cost categories; each cost entry is correctly allocated to a category; admin-extensible categories are created and used |
| AC-5 | **Labor entry with subcategories** | Labor entry form captures Hours Worked and Hours Travel separately; travel time is displayed as a distinct subcategory; amount computation includes travel time |
| AC-6 | **Change order amendments** | Change orders are created against specific budget lines; approved change orders update the working budget; pending change orders appear in Committed column |
| AC-7 | **Invoice generation** | Invoices are generated from approved, unbilled cost and labor entries; line items reflect cost category and amount; subtotal, tax, and total are computed; invoice numbers are unique per organization |
| AC-8 | **Stripe integration** | "Send & Collect Payment" creates a Stripe Checkout session; webhook updates invoice status to Paid on success; failed payment creates a notification |
| AC-9 | **All 5 reports available** | Job P&L, Cost-to-Date vs Budget, Labor Utilization, WIP Summary, and Job Status Dashboard are accessible, filterable, and exportable to CSV and PDF |
| AC-10 | **Offline mode functional** | Field workers can log cost entries while offline; data persists in local storage; entries sync automatically when connectivity is restored with conflict resolution |

---

*Document status: **✅ READY FOR ARCHITECT** — All 15 open questions resolved, no [TBD] or [pending] markers remain.*
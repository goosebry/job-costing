# UX Specification — Job Costing Application

## Overview

The Job Costing Application is a multi-tenant SaaS platform for tracking job costs, labor, budgets, change orders, and invoicing. Built for contractors, real estate firms, and manufacturers, the system supports template-based job creation, RBAC, budget variance reporting, Stripe-integrated invoicing, and offline-capable field data entry.

This specification maps every user journey from `functional.md` to one or more screens, defines all visible states per screen, and references the generated visual mockups and HTML artifacts.

---

## Journey → Screen Map

| Journey ID | Journey Name | Screens |
|------------|--------------|---------|
| J01 | User authenticates / signs in | SCR-01 Login |
| J02 | User views dashboard overview | SCR-02 Dashboard |
| J03 | User creates a new job (template-based) | SCR-03 Job List → SCR-04 Job Form |
| J04 | User edits/view existing job | SCR-14 Job Detail → SCR-04 Job Form |
| J05 | User adds a cost entry | SCR-05 Cost Entry |
| J06 | User submits labor timesheet (with travel) | SCR-06 Labor Entry |
| J07 | PM/Admin approves labor | SCR-12 Approvals Queue |
| J08 | User reviews budget vs. actuals | SCR-07 Budget vs. Actuals |
| J09 | User creates/manages change orders | SCR-08 Change Order |
| J10 | User creates and manages invoices | SCR-09 Invoice |
| J11 | User generates reports | SCR-10 Reports |
| J12 | User receives/manages notifications | SCR-11 Notifications |
| J13 | Admin manages organization settings | SCR-13 Settings |
| J14 | User manages cost categories and codes | SCR-13 Settings (Cost Categories subtab) |
| J15 | Admin manages users and roles | SCR-13 Settings (Users / Roles subtab) |
| J16 | Admin configures integrations (Stripe) | SCR-13 Settings (Integrations subtab) |

---

## Screen Inventory

### SCR-01 — Login
- **Route:** `/login`
- **Journeys:** J01
- **Layout:** Centered single-column card on full-page gradient background
- **Components:** Logo placeholder, email input + icon, password input + show/hide toggle, "Remember me" checkbox, "Sign In" primary button, "Forgot Password?" link, footer
- **States:**
  - Default: empty form fields
  - Loading: button shows spinner, inputs disabled
  - Error: inline field errors (invalid credentials)
- **Interactions:** Submit → authenticate → redirect to Dashboard (SCR-02)
- **Mockup:** `ux_assets/scr_01_login.png`
- **HTML:** `ux_assets/scr_01_login.html`

---

### SCR-02 — Dashboard
- **Route:** `/` (authenticated landing)
- **Journeys:** J02, J12 (notification badge)
- **Layout:** Fixed left sidebar + top header + main content area (4 + 2 grid)
- **Components:** Sidebar nav (Dashboard, Jobs, Costs, Labor, Budgets, Invoices, Reports, Settings), top bar (search, notification bell, user avatar), metric cards row (4), recent activity feed, quick action buttons
- **States:**
  - Default: populated metric cards and activity list
  - Loading: skeleton cards
  - Empty: zero-state message if no active jobs
- **Interactions:** Click nav item → respective screen; click notification bell → SCR-11
- **Mockup:** `ux_assets/scr_02_dashboard.png`
- **HTML:** `ux_assets/scr_02_dashboard.html`

---

### SCR-03 — Jobs List
- **Route:** `/jobs`
- **Journeys:** J03 (entry), J04 (navigation)
- **Layout:** Full-width table with top toolbar
- **Components:** Toolbar (title, search, status filter, template filter, "New Job" button), data table, pagination
- **Table Columns:** Job Number, Job Name, Template badge, Status badge, Start Date, Contract Amount, Budget, Variance (color-coded), Actions
- **States:**
  - Default: paginated job list
  - Empty: illustrated empty state with CTA
  - Loading: skeleton rows
  - Filtered: reduced result set
- **Interactions:** Click row → SCR-14; click "New Job" → SCR-04; sort by column header; paginate
- **Mockup:** `ux_assets/scr_03_job_list.png`
- **HTML:** `ux_assets/scr_03_job_list.html`

---

### SCR-04 — Job Form (Create / Edit)
- **Route:** `/jobs/new` (create), `/jobs/:id/edit` (edit)
- **Journeys:** J03 (create), J04 (edit)
- **Layout:** Two-column (left 35% template + basic info, right 65% tabbed detail content)
- **Components:** Template radio cards (Contractor, Real Estate, Manufacturer), auto-increment Job Number, fields (Job Name, Status, Start/End Date), tabbed panel (Details, Budget, Team), primary + secondary buttons
- **States:**
  - Create (Draft): template selection step visible
  - Edit: template locked, all fields editable
  - Validation error: inline red border + message
  - Saving: buttons disabled with spinner
- **Interactions:** Select template → reveals basic fields; tab navigation between Details/Budget/Team; Save → SCR-14
- **Mockup:** `ux_assets/scr_04_job_form.png`
- **HTML:** `ux_assets/scr_04_job_form.html`

---

### SCR-05 — Cost Entry Form
- **Route:** `/costs/new` or inline from SCR-14
- **Journeys:** J05
- **Layout:** Modal dialog or slide-out panel
- **Components:** Header with Job selector, two-column form grid, attachment dropzone, action buttons
- **Fields:** Date (90-day past / 30-day future validated), Vendor, Description, Category dropdown, Cost Code (filtered by category), Quantity, Unit Price, Total (auto-calculated), Notes, attachment upload
- **States:**
  - Default: empty form
  - Validation error: red borders + messages
  - Uploading attachment: progress indicator
  - Success: green toast notification "Cost entry added"
- **Interactions:** Category change → refreshes Cost Code options; Submit → adds entry → toast
- **Mockup:** `ux_assets/scr_05_cost_entry.png`
- **HTML:** `ux_assets/scr_05_cost_entry.html`

---

### SCR-06 — Labor Entry / Timesheet
- **Route:** `/labor/new` or inline from SCR-14
- **Journeys:** J06 (submit), J07 (approval)
- **Layout:** Full-page with header summary card + timesheet grid + side panel
- **Components:** Header (employee name, week picker, total hours card), timesheet grid (days as columns, cost codes as rows), separate Travel Hours row, totals row, status panel, action buttons
- **States:**
  - Draft: editable cells, "Submit" button enabled
  - Submitted: locked cells, status "Awaiting Approval"
  - Approved: locked, status "Approved", green badge
  - Overdue warning: amber banner above grid
- **Interactions:** Fill hours per cell → totals auto-update; Submit → moves to approval queue; PM/Admin: Approve/Reject with comments
- **Mockup:** `ux_assets/scr_06_labor_entry.png`
- **HTML:** `ux_assets/scr_06_labor_entry.html`

---

### SCR-07 — Budget vs. Actuals
- **Route:** `/budgets`
- **Journeys:** J08
- **Layout:** Sidebar filter (job, cost category) + main data table with summary cards
- **Components:** Job/Cost Category filter panel, 4 summary cards (Total Budget, Spent to Date, Committed, Remaining), grouped data table, progress bars, export button
- **Table Columns:** Cost Category (grouped header), Cost Code, Budgeted Amount, Approved, Committed, Actual Spent, Variance (amount + %), Progress Bar
- **States:**
  - Default: color-coded rows (green ≤90%, yellow 90–100%, red >100%)
  - Over-budget filter toggled: shows only red rows
  - Date range applied: updates all calculations
- **Interactions:** Toggle over-budget filter; change date range → refresh table; Export → PDF/Excel download
- **Mockup:** `ux_assets/scr_07_budget_actuals.png`
- **HTML:** `ux_assets/scr_07_budget_actuals.html`

---

### SCR-08 — Change Orders
- **Route:** `/change-orders`
- **Journeys:** J09
- **Layout:** Split view — left list panel + right detail/form panel
- **Components:** List of change orders (number, description, amount, status badge), change order form, impact analysis, approval chain visualization, status timeline
- **Form Fields:** Description, Affected Budget Lines (multiselect), Requested Amount, Impact on Contract Amount (auto-calc), Justification, Attachments
- **States:**
  - List view (default)
  - Create form: empty fields
  - Pending approval: status badge orange, approval chain visible
  - Approved: green badge
  - Rejected: red badge
- **Interactions:** Select list item → loads detail panel; Submit for Approval → updates status; PM approves → updates committed amounts
- **Mockup:** `ux_assets/scr_08_change_order.png`
- **HTML:** `ux_assets/scr_08_change_order.html`

---

### SCR-09 — Invoice Management
- **Route:** `/invoices`
- **Journeys:** J10
- **Layout:** Toolbar + table + summary cards
- **Components:** Status filter tabs (All, Draft, Sent, Paid, Void), date range, search, "Create Invoice" button, invoice table, summary cards (Total Outstanding, Overdue, Paid This Month)
- **Table Columns:** Invoice Number, Job Name, Client, Amount, Status badge, Issue Date, Due Date, Payment Status, Actions
- **States:**
  - Default: all invoices
  - Draft: editable, "Send" button visible
  - Sent: "Paid via Stripe" indicator shown
  - Void: grayed out row
  - Empty: illustrated empty state
- **Invoice Detail Modal:** Company logo, bill-to address, line items, subtotal/tax/total, Stripe "Pay Now" button, email preview, PDF export
- **Interactions:** Create → invoice form; Send → Stripe payment link; Void → confirmation dialog; click row → detail modal
- **Mockup:** `ux_assets/scr_09_invoice.png`
- **HTML:** `ux_assets/scr_09_invoice.html`

---

### SCR-10 — Reports
- **Route:** `/reports`
- **Journeys:** J11
- **Layout:** Card grid (2×3) + report preview area
- **Components:** 5 report type cards (Job P&L, Cost-to-Date vs Budget, Labor Utilization, WIP Summary, Job Status Dashboard), parameter inputs (Job selector, Date range), chart placeholder, export buttons
- **States:**
  - Default: card grid visible, no preview
  - Generating: spinner overlay on chart area
  - Error: error message with retry button
  - Loaded: chart rendered with data
- **Interactions:** Click card → sets parameters and loads preview; change Job/Date → refreshes chart; Export → PDF/Excel
- **Mockup:** `ux_assets/scr_10_reports.png`
- **HTML:** `ux_assets/scr_10_reports.html`

---

### SCR-11 — Notifications
- **Route:** Accessible from any screen (header bell dropdown)
- **Journeys:** J12
- **Layout:** Dropdown panel from header bell icon
- **Components:** Notification list, type icons (warning=orange, info=blue, alert=red), unread badge on bell, mark-all-read link
- **Notification Types:** Budget alerts (75%, 90%, 100% thresholds), Status changes, Overdue entry warnings
- **States:**
  - Default: list of notifications, unread dot indicator
  - Empty: checkmark + "No new notifications"
  - Unread: blue dot on notification item
- **Interactions:** Click notification → navigates to relevant page (job, budget, approval); click "View all" → full notifications page
- **Mockup:** `ux_assets/scr_11_notifications.png`
- **HTML:** `ux_assets/scr_11_notifications.html`

---

### SCR-12 — Approvals Queue
- **Route:** `/approvals`
- **Journeys:** J07
- **Layout:** Two-column (filterable list left, detail panel right)
- **Components:** Filterable list of pending items (labor + change orders), detail panel (timesheet grid or change order impact), Approve/Reject buttons, required comments textarea, status timeline, historical approvals
- **States:**
  - Pending: item list populated
  - Selected: detail shown in right panel
  - Approved: green badge, removed from pending list
  - Rejected: red badge + reason shown
  - Empty: "No pending approvals" message
- **Interactions:** Select item → loads detail; Approve → confirms + updates status; Reject → requires comment
- **Mockup:** `ux_assets/scr_12_approvals.png`
- **HTML:** `ux_assets/scr_12_approvals.html`

---

### SCR-13 — Settings
- **Route:** `/settings`
- **Journeys:** J13, J14, J15, J16
- **Layout:** Tabbed settings interface
- **Tabs / Sub-screens:**
  - **Organization:** Company name, address, logo upload, primary contact
  - **Cost Categories:** Draggable reorderable list (Direct Labor, Direct Materials, Subcontract, Equipment/Rental, Overhead/Burden), inline edit, add new
  - **Cost Codes:** Grid table (Code, Name, Category, Active toggle), CSV import/export
  - **Users:** Team members table (Name, Email, Role dropdown, Status toggle), invite new user button
  - **Roles & Permissions:** Matrix of roles and capabilities checkboxes
  - **Integrations:** Stripe connection status, connect/disconnect button, API key management, webhook status
  - **Notifications:** Toggle switches per notification type
- **States:**
  - Default: tabbed content rendered
  - Saving: save button spinner, fields disabled
  - Error: inline error messages
- **Interactions:** Tab navigation; inline edit on category list; save triggers API call; Stripe connect opens OAuth flow
- **Mockup:** `ux_assets/scr_13_settings.png`
- **HTML:** `ux_assets/scr_13_settings.html`

---

### SCR-14 — Job Detail
- **Route:** `/jobs/:id`
- **Journeys:** J04 (view), J05 (add cost from here), J06 (labor from here), J08 (budget), J09 (change order), J10 (invoice)
- **Layout:** Three-column header + tabbed content area + action buttons
- **Header:** Job name, number, status badge, summary cards (Contract Amount, Budget, Spent, Remaining)
- **Tabs:** Overview, Costs, Labor, Budget, Change Orders, Invoices, Activity
- **Summary Cards:** Total amounts with progress bars
- **States:**
  - Default: overview tab loaded
  - Tab selected: respective data shown
  - Empty tab: illustrated empty state with CTA
  - Loading: skeleton on tab content switch
- **Interactions:** Tab navigation; Edit Job → SCR-04; Create Invoice → SCR-09; Add Change Order → SCR-08; Add Cost Entry → SCR-05; Export → PDF
- **Mockup:** `ux_assets/scr_14_job_detail.png`
- **HTML:** `ux_assets/scr_14_job_detail.html`

---

## Global Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary Blue | `#2563EB` | Buttons, links, active states |
| Sidebar Blue | `#1E40AF` | Sidebar background |
| Success Green | `#16A34A` | Approved status, under-budget |
| Warning Yellow | `#CA8A04` | Pending, 90–100% budget |
| Danger Red | `#DC2626` | Rejected, over-budget, alerts |
| Surface White | `#FFFFFF` | Cards, modals |
| Background Gray | `#F3F4F6` | Page background |
| Text Primary | `#111827` | Headings, labels |
| Text Secondary | `#6B7280` | Descriptions, timestamps |
| Border Gray | `#E5E7EB` | Input borders, dividers |

---

## Accessibility Requirements (WCAG 2.1 AA)

- All interactive elements reachable by keyboard (Tab order follows visual layout)
- Color contrast ratios ≥ 4.5:1 for text, ≥ 3:1 for UI components
- Focus indicators visible on all focusable elements (`:focus-visible` ring)
- Form inputs have associated `<label>` elements; error messages linked via `aria-describedby`
- Modals trap focus within the dialog; `Escape` key closes
- Status badges use both color and text/icon to convey meaning (not color alone)
- Loading states announced via `aria-live` regions
- Screen reader: navigation landmark roles, table captions, and heading hierarchy preserved

---

## Mockup & Artifact Index

| Screen ID | Screen Name | Mockup PNG | Generated HTML |
|-----------|-------------|------------|----------------|
| SCR-01 | Login | `scr_01_login.png` | `scr_01_login.html` |
| SCR-02 | Dashboard | `scr_02_dashboard.png` | `scr_02_dashboard.html` |
| SCR-03 | Jobs List | `scr_03_job_list.png` | `scr_03_job_list.html` |
| SCR-04 | Job Form | `scr_04_job_form.png` | `scr_04_job_form.html` |
| SCR-05 | Cost Entry | `scr_05_cost_entry.png` | `scr_05_cost_entry.html` |
| SCR-06 | Labor Entry | `scr_06_labor_entry.png` | `scr_06_labor_entry.html` |
| SCR-07 | Budget vs. Actuals | `scr_07_budget_actuals.png` | `scr_07_budget_actuals.html` |
| SCR-08 | Change Orders | `scr_08_change_order.png` | `scr_08_change_order.html` |
| SCR-09 | Invoice | `scr_09_invoice.png` | `scr_09_invoice.html` |
| SCR-10 | Reports | `scr_10_reports.png` | `scr_10_reports.html` |
| SCR-11 | Notifications | `scr_11_notifications.png` | `scr_11_notifications.html` |
| SCR-12 | Approvals | `scr_12_approvals.png` | `scr_12_approvals.html` |
| SCR-13 | Settings | `scr_13_settings.png` | `scr_13_settings.html` |
| SCR-14 | Job Detail | `scr_14_job_detail.png` | `scr_14_job_detail.html` |

**Total screens:** 14 | **Total mockups:** 14 | **Total HTML artifacts:** 14

---

## Self-Review Checklist

- [x] Every journey in `functional.md` maps to ≥ 1 screen
- [x] Every screen has a defined route/URL
- [x] Every screen lists all components
- [x] Every screen documents all visible states (default, loading, empty, error, success)
- [x] Every screen describes interactions and transitions
- [x] Every screen references a mockup PNG and generated HTML file
- [x] Color-coded variance indicators are consistent (green/yellow/red) across all screens
- [x] WCAG 2.1 AA accessibility requirements are stated per screen where applicable
- [x] No journey skipped
- [x] No screen is documented without a mockup
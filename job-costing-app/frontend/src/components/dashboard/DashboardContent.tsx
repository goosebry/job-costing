import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useJobStatuses } from '../../hooks/useJobStatuses';

async function fetchDashboard() {
  const res = await api.get('/dashboard/summary');
  return res.data;
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

type KpiKey = 'activeJobs' | 'budget' | 'invoices' | 'approvals';

function KpiCard({
  id, label, value, sub, icon, accent, selected, onClick,
}: {
  id: KpiKey; label: string; value: string; sub?: string; icon: string;
  accent?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-5 flex items-start gap-4 w-full text-left transition-all duration-150 cursor-pointer group
        ${selected
          ? 'ring-2 ring-primary-500 border-primary-300 bg-primary-50/40 shadow-md'
          : 'hover:shadow-md hover:border-gray-300'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accent || 'bg-primary-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-gray-300 mt-1 transition-transform duration-150 ${selected ? 'text-primary-500 rotate-180' : 'group-hover:text-gray-400'}`}>
        ▼
      </span>
    </button>
  );
}

function DrillTable({ kpi, data }: { kpi: KpiKey; data: any }) {
  const navigate = useNavigate();
  const { getLabel, getBadgeStyle } = useJobStatuses();

  // Always call hooks unconditionally — use `enabled` to control fetching
  const { data: rawInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices-drill'],
    queryFn: async () => { const r = await api.get('/invoices'); return r.data; },
    enabled: kpi === 'invoices',
  });

  const { data: rawOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['approvals-drill'],
    queryFn: async () => { const r = await api.get('/change-orders'); return r.data; },
    enabled: kpi === 'approvals',
  });

  // Safely unwrap paginated or plain array responses
  const invoiceList: any[] = Array.isArray(rawInvoices)
    ? rawInvoices
    : rawInvoices?.data || rawInvoices?.invoices || [];
  const orderList: any[] = Array.isArray(rawOrders)
    ? rawOrders
    : rawOrders?.data || rawOrders?.changeOrders || [];

  const pendingInvoices = invoiceList.filter((i: any) => i.status === 'SENT' || i.status === 'PENDING');
  const pendingOrders = orderList.filter((o: any) => o.status === 'PENDING');

  if (kpi === 'activeJobs') {
    const jobs = (data?.recentJobs || []).filter((j: any) =>
      ['ACTIVE', 'IN_PROGRESS', 'PLANNING', 'DRAFT'].includes(j.status)
    );
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Active Jobs</h3>
        {jobs.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No active jobs</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-medium text-gray-500">Job</th>
                <th className="pb-2 font-medium text-gray-500">Client</th>
                <th className="pb-2 font-medium text-gray-500">Status</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Budget Used</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.map((j: any) => (
                <tr
                  key={j.id}
                  onClick={() => navigate(`/jobs/${j.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-gray-900">{j.name}</p>
                    <p className="text-xs text-gray-400">{j.jobNumber}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{j.clientName || '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={getBadgeStyle(j.status)}>
                      {getLabel(j.status)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`font-semibold ${j.budgetPct >= 90 ? 'text-red-600' : j.budgetPct >= 75 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {j.budgetPct}%
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-gray-300 hover:text-primary-500">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link to="/jobs" className="text-sm text-primary-600 hover:underline">View all jobs →</Link>
        </div>
      </div>
    );
  }

  if (kpi === 'budget') {
    const jobs = data?.recentJobs || [];
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Budget by Job</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 font-medium text-gray-500">Job</th>
              <th className="pb-2 font-medium text-gray-500">Client</th>
              <th className="pb-2 font-medium text-gray-500 text-right">Budget Used</th>
              <th className="pb-2 font-medium text-gray-500" />
              <th className="pb-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((j: any) => (
              <tr
                key={j.id}
                onClick={() => navigate(`/jobs/${j.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-gray-900">{j.name}</p>
                  <p className="text-xs text-gray-400">{j.jobNumber}</p>
                </td>
                <td className="py-2.5 pr-4 text-gray-600">{j.clientName || '—'}</td>
                <td className="py-2.5 pr-4 text-right font-mono text-sm">
                  <span className={j.budgetPct >= 90 ? 'text-red-600' : j.budgetPct >= 75 ? 'text-amber-600' : 'text-emerald-600'}>
                    {j.budgetPct}%
                  </span>
                </td>
                <td className="py-2.5 w-40">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(j.budgetPct, 100)}%`,
                        backgroundColor: j.budgetPct >= 90 ? '#ef4444' : j.budgetPct >= 75 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </td>
                <td className="py-2.5 pl-3 text-gray-300 hover:text-primary-500">→</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link to="/reports" className="text-sm text-primary-600 hover:underline">View full reports →</Link>
        </div>
      </div>
    );
  }

  if (kpi === 'invoices') {
    // Build a jobId → job lookup from dashboard summary data
    const jobMap = new Map<string, any>();
    (data?.recentJobs || []).forEach((j: any) => jobMap.set(j.id, j));

    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Outstanding Invoices</h3>
        {loadingInvoices ? (
          <p className="text-gray-400 text-sm py-4 text-center">Loading…</p>
        ) : pendingInvoices.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No outstanding invoices 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-medium text-gray-500">Invoice #</th>
                <th className="pb-2 font-medium text-gray-500">Job</th>
                <th className="pb-2 font-medium text-gray-500">Issued</th>
                <th className="pb-2 font-medium text-gray-500">Due Date</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Amount</th>
                <th className="pb-2 font-medium text-gray-500">Status</th>
                <th className="pb-2 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingInvoices.map((inv: any) => {
                const overdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                const linkedJob = inv.jobId ? jobMap.get(inv.jobId) : null;
                const jobLabel = linkedJob?.name || (inv.jobId ? `Job ${inv.jobId}` : '—');
                return (
                  <tr
                    key={inv.id}
                    onClick={() => inv.jobId && navigate(`/jobs/${inv.jobId}`)}
                    className={`group transition-colors ${inv.jobId ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-2.5 pr-4 font-semibold text-gray-900">
                      {inv.number || inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 pr-4">
                      {inv.jobId ? (
                        <span className="text-primary-700 font-medium group-hover:underline">
                          {jobLabel}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-NZ') : '—'}
                    </td>
                    <td className={`py-2.5 pr-4 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-NZ') : '—'}
                      {overdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-bold text-gray-900">
                      {fmt(inv.total || inv.amount || 0)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-300 group-hover:text-primary-500 transition-colors text-right">→</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link to="/invoices" className="text-sm text-primary-600 hover:underline">View all invoices →</Link>
        </div>
      </div>
    );
  }

  if (kpi === 'approvals') {
    return (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Pending Approvals</h3>
        {loadingOrders ? (
          <p className="text-gray-400 text-sm py-4 text-center">Loading…</p>
        ) : pendingOrders.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No pending approvals 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-medium text-gray-500">Change Order</th>
                <th className="pb-2 font-medium text-gray-500">Job</th>
                <th className="pb-2 font-medium text-gray-500">Description</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Amount</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingOrders.map((o: any) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/jobs/${o.jobId}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-2.5 pr-4 font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    <Link to={`/jobs/${o.jobId}`} className="hover:text-primary-600" onClick={e => e.stopPropagation()}>
                      {o.jobId}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{o.description}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold">{fmt(o.amount || 0)}</td>
                  <td className="py-2.5 pl-3 text-gray-300 hover:text-primary-500">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link to="/approvals" className="text-sm text-primary-600 hover:underline">View all approvals →</Link>
        </div>
      </div>
    );
  }

  return null;
}

export function DashboardContent() {
  const navigate = useNavigate();
  const { getLabel, getBadgeStyle } = useJobStatuses();
  const [selectedKpi, setSelectedKpi] = useState<KpiKey | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
  });

  const toggleKpi = (key: KpiKey) => setSelectedKpi(prev => prev === key ? null : key);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="card h-24 bg-gray-50" />)}
      </div>
    );
  }

  if (error || !data) {
    return <div className="card text-center py-8 text-red-400">Failed to load dashboard data</div>;
  }

  const { kpis, atRiskJobs, recentJobs } = data;
  const overallPct = kpis.totalBudget > 0 ? Math.round((kpis.totalSpent / kpis.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard id="activeJobs" label="Active Jobs" value={String(kpis.activeJobs)}
          sub={`${kpis.totalJobs} total`} icon="📋" accent="bg-blue-50"
          selected={selectedKpi === 'activeJobs'} onClick={() => toggleKpi('activeJobs')} />
        <KpiCard id="budget" label="Total Budget" value={fmt(kpis.totalBudget)}
          sub={`${fmt(kpis.totalSpent)} spent (${overallPct}%)`} icon="📊" accent="bg-indigo-50"
          selected={selectedKpi === 'budget'} onClick={() => toggleKpi('budget')} />
        <KpiCard id="invoices" label="Outstanding Invoices" value={String(kpis.pendingInvoiceCount)}
          sub={kpis.pendingInvoiceValue > 0 ? `${fmt(kpis.pendingInvoiceValue)} awaiting payment` : 'All clear'}
          icon="🧾" accent={kpis.pendingInvoiceCount > 0 ? 'bg-amber-50' : 'bg-emerald-50'}
          selected={selectedKpi === 'invoices'} onClick={() => toggleKpi('invoices')} />
        <KpiCard id="approvals" label="Pending Approvals" value={String(kpis.pendingApprovals)}
          sub={kpis.atRiskCount > 0 ? `${kpis.atRiskCount} job${kpis.atRiskCount > 1 ? 's' : ''} need attention` : 'Nothing urgent'}
          icon={kpis.pendingApprovals > 0 ? '⚠️' : '✅'}
          accent={kpis.pendingApprovals > 0 ? 'bg-red-50' : 'bg-emerald-50'}
          selected={selectedKpi === 'approvals'} onClick={() => toggleKpi('approvals')} />
      </div>

      {/* Drill-down panel */}
      {selectedKpi && (
        <div className="card border-primary-200 border-2 relative animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => setSelectedKpi(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          <DrillTable kpi={selectedKpi} data={data} />
        </div>
      )}

      {/* Portfolio health bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Overall Portfolio Budget</p>
          <span className="text-sm font-semibold text-gray-900">{overallPct}% used</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(overallPct, 100)}%`,
              backgroundColor: overallPct >= 90 ? '#ef4444' : overallPct >= 75 ? '#f59e0b' : '#10b981',
            }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{fmt(kpis.totalSpent)} spent</span>
          <span>{fmt(kpis.totalBudget - kpis.totalSpent)} remaining</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* At-risk jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Jobs Needing Attention
              {atRiskJobs.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{atRiskJobs.length}</span>
              )}
            </h2>
            <Link to="/jobs" className="text-sm text-primary-600 hover:underline">All jobs →</Link>
          </div>
          {atRiskJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p>All jobs are on track</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskJobs.map((job: any) => (
                <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}
                  className="border border-gray-100 rounded-xl p-3 hover:border-red-200 hover:bg-red-50/30 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.name}</p>
                      <p className="text-xs text-gray-400">{job.jobNumber} · {job.clientName || 'Unbound'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${job.risk === 'over' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                      {job.risk === 'over' ? '⚠ Over Budget' : '● At Risk'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(job.budgetPct, 100)}%`, backgroundColor: job.risk === 'over' ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>{fmt(job.totalActual)} spent</span>
                    <span className="font-medium">{job.budgetPct}% of {fmt(job.estimatedBudget)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs/new" className="btn-primary text-sm">+ New Job</Link>
          </div>
          <div className="space-y-2">
            {recentJobs.map((job: any) => (
              <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{job.name}</p>
                  <p className="text-xs text-gray-400 truncate">{job.jobNumber}{job.clientName ? ` · ${job.clientName}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={getBadgeStyle(job.status)}>
                    {getLabel(job.status)}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '📋', label: 'New Job', desc: 'Start tracking a new project', to: '/jobs/new' },
          { icon: '🏢', label: 'Add Client', desc: 'Register a new client', to: '/clients' },
          { icon: '📉', label: 'View Reports', desc: 'WIP, profitability & cash flow', to: '/reports' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className="card p-5 hover:shadow-md hover:border-primary-200 border border-transparent transition-all flex items-start gap-3">
            <span className="text-2xl">{a.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{a.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '../services/jobs.service';
import { costsService } from '../services/costs.service';
import { laborService } from '../services/labor.service';
import { changeOrdersService } from '../services/change-orders.service';
import { budgetService, BudgetSummary } from '../services/budget.service';
import { invoicesService } from '../services/invoices.service';
import api from '../services/api';
import { usePermission } from '../hooks/usePermission';
import { useJobStatuses } from '../hooks/useJobStatuses';
import { CostEntryModal } from '../components/CostEntryModal';
import { LaborEntryModal } from '../components/LaborEntryModal';
import { ChangeOrderModal } from '../components/ChangeOrderModal';
import { InvoiceViewModal } from '../components/InvoiceViewModal';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canUpdateJob = usePermission('jobs:write');
  const canCreateCost = usePermission('costs:write');
  const canCreateLabor = usePermission('labor:write');
  const canCreateInvoice = usePermission('invoices:write');
  const { getBadgeStyle, getLabel } = useJobStatuses();

  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'labor' | 'changeorders' | 'invoices'>('overview');
  const [costModalCategory, setCostModalCategory] = useState<string | null>(null); // null = closed, string = open with that category
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeResult, setCompleteResult] = useState<any>(null);
  const [completeSendEmail, setCompleteSendEmail] = useState(true);
  const [completeNotes, setCompleteNotes] = useState('');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyForm, setCopyForm] = useState({ name: '', startedAt: '' });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id!),
    enabled: !!id,
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetService.getBudgetSummary(id!),
    enabled: !!id && activeTab === 'overview',
  });

  const { data: costs } = useQuery({
    queryKey: ['costs', id],
    queryFn: () => costsService.getCostsByJob(id!),
    enabled: !!id && activeTab === 'costs',
  });

  const { data: labor } = useQuery({
    queryKey: ['labor', id],
    queryFn: () => laborService.getLaborByJob(id!),
    enabled: !!id && activeTab === 'labor',
  });

  const { data: changeOrders } = useQuery({
    queryKey: ['changeOrders', id],
    queryFn: () => changeOrdersService.getChangeOrdersByJob(id!),
    enabled: !!id && activeTab === 'changeorders',
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesService.getInvoices({ jobId: id }),
    enabled: !!id && activeTab === 'invoices',
  });

  const approveMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: 'APPROVED' | 'REJECTED' }) =>
      changeOrdersService.approveChangeOrder(orderId, status),
    onSuccess: () => {
      // Invalidate all queries that reflect pending approvals count
      queryClient.invalidateQueries({ queryKey: ['changeOrders', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-drill'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: { sendEmail: boolean; notes: string }) =>
      jobsService.completeJob(id!, data),
    onSuccess: (result) => {
      setCompleteResult(result);
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
      queryClient.invalidateQueries({ queryKey: ['changeOrders', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: string }) =>
      api.patch(`/invoices/${invoiceId}/status`, { status }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices', id] }),
  });

  const copyMutation = useMutation({
    mutationFn: (data: { name: string; startedAt?: string }) =>
      jobsService.copyJob(id!, { ...data, clientId: job?.clientId }),
    onSuccess: (newJob) => {
      setShowCopyModal(false);
      navigate(`/jobs/${newJob.id}`);
    },
  });

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
  if (error || !job) return <div className="text-center py-12 text-red-500">Failed to load job</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/jobs')} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
            ← Back to Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
          <p className="text-gray-500">
            {job.jobNumber}
            {job.client ? (
              <> · <Link to={`/clients/${job.clientId}`} className="text-primary-600 hover:underline">{job.client.name}</Link></>
            ) : job.clientName ? (
              <> · {job.clientName}</>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium border"
            style={getBadgeStyle(job.status)}
          >
            {getLabel(job.status)}
          </span>
        </div>
      </div>

      {/* ── Contextual Action Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Quick Actions</span>
        <button
          onClick={() => { setCostModalCategory('Materials'); setActiveTab('costs'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
        >
          <span>🧱</span> Add Materials
        </button>
        <button
          onClick={() => { setCostModalCategory('Subcontractor'); setActiveTab('costs'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-400 hover:text-orange-700 hover:bg-orange-50 transition-all shadow-sm"
        >
          <span>🔧</span> Add Subcontractor
        </button>
        <button
          onClick={() => setShowLaborModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all shadow-sm"
        >
          <span>⏱️</span> Add Labour
        </button>
        <button
          onClick={() => setShowChangeOrderModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all shadow-sm"
        >
          <span>📝</span> Change Order
        </button>
        <button
          onClick={() => {
            invoicesService.createInvoice({ jobId: id!, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
              .then(() => { queryClient.invalidateQueries({ queryKey: ['invoices', id] }); setActiveTab('invoices'); });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-300 rounded-lg text-sm font-semibold text-green-700 hover:bg-green-50 hover:border-green-500 transition-all shadow-sm"
        >
          <span>🧾</span> Issue Invoice
        </button>
        {/* Complete Job button — only for non-completed jobs */}
        {job.status !== 'COMPLETED' && (
          <button
            onClick={() => { setShowCompleteModal(true); setCompleteResult(null); setCompleteSendEmail(true); setCompleteNotes(''); }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm ml-2"
          >
            <span>✓</span> Complete Job
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setShowCopyModal(true); setCopyForm({ name: `${job.name} (Copy)`, startedAt: '' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-all shadow-sm"
          >
            <span>📄</span> Copy Job
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-4 border-b border-gray-200">
        {['overview', 'costs', 'labor', 'changeorders', 'invoices'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'changeorders' ? 'Change Orders' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && budget && (() => {
        const pct = budget.estimatedBudget > 0
          ? Math.min(Math.round((budget.totalActual / budget.estimatedBudget) * 100), 999)
          : 0;
        const risk = pct >= 90 ? 'over' : pct >= 75 ? 'at_risk' : 'on_track';
        const barColor = risk === 'over' ? '#ef4444' : risk === 'at_risk' ? '#f59e0b' : '#10b981';
        const forecastToComplete = budget.estimatedBudget > 0
          ? Math.max(budget.estimatedBudget - budget.totalActual, 0)
          : 0;
        const costs = budget.totalCosts ?? 0;
        const labor = budget.totalLabor ?? 0;

        return (
          <div className="space-y-4">
            {/* Budget health card */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Budget Health</h2>
                {risk === 'over' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                    ⚠ OVER BUDGET
                  </span>
                )}
                {risk === 'at_risk' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    ● At Risk — {pct}% used
                  </span>
                )}
                {risk === 'on_track' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    ✓ On Track — {pct}% used
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-1">
                <div
                  className="h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-5">
                <span>${Math.round(budget.totalActual).toLocaleString()} spent</span>
                <span>${Math.round(budget.estimatedBudget).toLocaleString()} budget</span>
              </div>

              {/* 4 stat boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Estimated Budget</p>
                  <p className="text-lg font-bold text-gray-900">${Math.round(budget.estimatedBudget).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900">${Math.round(budget.totalActual).toLocaleString()}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${budget.variance < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className="text-xs text-gray-400 mb-1">Variance</p>
                  <p className={`text-lg font-bold ${budget.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {budget.variance >= 0 ? '+' : ''}${Math.round(budget.variance).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Forecast to Complete</p>
                  <p className="text-lg font-bold text-gray-900">${forecastToComplete.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* ── Next Steps Panel ── */}
            {(() => {
              const steps: { icon: string; title: string; desc: string; action: () => void; cta: string; urgent?: boolean }[] = [];
              if (costs === 0 && labor === 0)
                steps.push({ icon: '🧱', title: 'Record your first cost', desc: 'Add materials, subcontract or other expenses to start tracking spend.', action: () => setCostModalCategory('Materials'), cta: 'Add Materials' });
              if (labor === 0)
                steps.push({ icon: '⏱️', title: 'Log labour hours', desc: 'Track who worked on this job and for how long.', action: () => setShowLaborModal(true), cta: 'Add Labour' });
              if (costs === 0 && labor > 0)
                steps.push({ icon: '🧱', title: 'Add material costs', desc: 'Materials spend is not yet recorded against this job.', action: () => setCostModalCategory('Materials'), cta: 'Add Materials' });
              if (budget.totalActual > 0)
                steps.push({ icon: '🧾', title: 'Ready to invoice?', desc: `$${Math.round(budget.totalActual).toLocaleString()} in costs recorded — generate an invoice for your client.`, action: () => { invoicesService.createInvoice({ jobId: id!, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).then(() => { queryClient.invalidateQueries({ queryKey: ['invoices', id] }); setActiveTab('invoices'); }); }, cta: 'Generate Invoice', urgent: pct > 80 });
              if (steps.length === 0) return null;
              return (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">💡 Suggested Next Steps</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {steps.slice(0, 4).map((s, i) => (
                      <button key={i} onClick={s.action}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all group hover:shadow-sm ${
                          s.urgent ? 'border-amber-300 bg-amber-50 hover:border-amber-400' : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50'
                        }`}>
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl mt-0.5">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold mb-0.5 ${s.urgent ? 'text-amber-800' : 'text-gray-900'}`}>{s.title}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                        <div className={`mt-2.5 text-xs font-semibold ${s.urgent ? 'text-amber-700' : 'text-primary-600'} group-hover:underline`}>{s.cta} →</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Cost breakdown */}
            {(costs > 0 || labor > 0) && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Breakdown</h3>
                <div className="space-y-2">
                  {costs > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Materials / Subcontract</span>
                        <span className="font-medium">${costs.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-400" style={{ width: `${budget.estimatedBudget > 0 ? Math.min((costs / budget.estimatedBudget) * 100, 100) : 0}%` }} />
                      </div>
                    </div>
                  )}
                  {labor > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Labour</span>
                        <span className="font-medium">${labor.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-violet-400" style={{ width: `${budget.estimatedBudget > 0 ? Math.min((labor / budget.estimatedBudget) * 100, 100) : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job details */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Details</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-400">Job Number</dt>
                  <dd className="font-medium text-gray-900">{job.jobNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Status</dt>
                  <dd><span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={getBadgeStyle(job.status)}>{getLabel(job.status)}</span></dd>
                </div>
                {job.client && (
                  <div>
                    <dt className="text-gray-400">Client</dt>
                    <dd><Link to={`/clients/${job.clientId}`} className="text-primary-600 hover:underline font-medium">{job.client.name}</Link></dd>
                  </div>
                )}
                {job.startedAt && (
                  <div>
                    <dt className="text-gray-400">Started</dt>
                    <dd className="font-medium">{new Date(job.startedAt).toLocaleDateString('en-NZ')}</dd>
                  </div>
                )}
                {job.completedAt && (
                  <div>
                    <dt className="text-gray-400">Completed</dt>
                    <dd className="font-medium">{new Date(job.completedAt).toLocaleDateString('en-NZ')}</dd>
                  </div>
                )}
                {job.estimatedHours != null && (
                  <div>
                    <dt className="text-gray-400">Estimated Time</dt>
                    <dd className="font-medium">{job.estimatedHours} hrs</dd>
                  </div>
                )}
                {job.description && (
                  <div className="col-span-2">
                    <dt className="text-gray-400">Description</dt>
                    <dd className="text-gray-700 mt-0.5">{job.description}</dd>
                  </div>
                )}
              </dl>
              {/* Labour hours progress vs estimate */}
              {job.estimatedHours != null && budget && (() => {
                const actualHrs = (budget.totalLabor ?? 0) / 65; // approx at $65/hr
                const pct = Math.min(Math.round((actualHrs / job.estimatedHours) * 100), 999);
                const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                return (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Labour time used</span>
                      <span className={pct >= 100 ? 'text-red-600 font-bold' : 'text-gray-500'}>{pct}% of {job.estimatedHours}h estimate</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}


      {activeTab === 'costs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Cost Entries</h2>
            {canCreateCost && <button onClick={() => setCostModalCategory('')} className="btn-primary">+ Add Cost</button>}
          </div>
          {!costs || costs.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🧱</p>
              <p className="text-gray-600 font-medium mb-1">No cost entries yet</p>
              <p className="text-sm text-gray-400 mb-4">Record materials, subcontract, and other expenses here.</p>
              {canCreateCost && <button onClick={() => setCostModalCategory('')} className="btn-primary text-sm">+ Add First Cost</button>}
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Vendor</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost: any) => (
                    <tr key={cost.id} className="border-t border-gray-100">
                      <td className="py-3 px-4 text-sm">{cost.category.name}</td>
                      <td className="py-3 px-4 text-sm">{cost.description}</td>
                      <td className="py-3 px-4 text-sm">{cost.vendor || '-'}</td>
                      <td className="py-3 px-4 text-sm text-right">${(cost.totalCost || cost.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'labor' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Labor Entries</h2>
            {canCreateLabor && <button onClick={() => setShowLaborModal(true)} className="btn-primary">+ Add Labour</button>}
          </div>
          {!labor || labor.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">⏱️</p>
              <p className="text-gray-600 font-medium mb-1">No labour entries yet</p>
              <p className="text-sm text-gray-400 mb-4">Log hours worked and travel time by worker or role.</p>
              {canCreateLabor && <button onClick={() => setShowLaborModal(true)} className="btn-primary text-sm">+ Log Labour</button>}
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Worker</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Hours</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Travel</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {labor.map((entry: any) => (
                    <tr key={entry.id} className="border-t border-gray-100">
                      <td className="py-3 px-4 text-sm">{entry.workerName}</td>
                      <td className="py-3 px-4 text-sm">{entry.role}</td>
                      <td className="py-3 px-4 text-sm text-right">{entry.hoursWorked}h</td>
                      <td className="py-3 px-4 text-sm text-right">{entry.hoursTravel}h</td>
                      <td className="py-3 px-4 text-sm text-right">${(entry.totalCost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'changeorders' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Change Orders</h2>
            <button onClick={() => setShowChangeOrderModal(true)} className="btn-primary">+ Add Change Order</button>
          </div>
          {!changeOrders || changeOrders.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No change orders yet</div>
          ) : (
            <div className="space-y-4">
              {changeOrders.map((co: any) => (
                <div key={co.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{co.orderNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">{co.description}</p>
                      <p className="text-sm text-gray-500 mt-2">${(co.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        co.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        co.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{co.status}</span>
                      {co.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => approveMutation.mutate({ orderId: co.id, status: 'APPROVED' })} className="btn-secondary text-sm">Approve</button>
                          <button onClick={() => approveMutation.mutate({ orderId: co.id, status: 'REJECTED' })} className="btn-danger text-sm">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (() => {
        const trackPayments: boolean = invoices?.trackInvoicePayments ?? false;
        return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium">Invoices</h2>
              {trackPayments && (
                <p className="text-xs text-gray-400 mt-0.5">Payment tracking is <span className="font-semibold text-blue-600">enabled</span> — mark invoices as paid below.</p>
              )}
            </div>
            {canCreateInvoice && <button onClick={() => invoicesService.createInvoice({ jobId: id!, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).then(() => queryClient.invalidateQueries({ queryKey: ['invoices', id] }))} className="btn-primary">Generate Invoice</button>}
          </div>
          {!invoices?.invoices || invoices.invoices.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🧾</p>
              <p className="text-gray-600 font-medium mb-1">No invoices yet</p>
              <p className="text-sm text-gray-400 mb-4">Generate an invoice from the costs recorded on this job.</p>
              {canCreateInvoice && <button onClick={() => invoicesService.createInvoice({ jobId: id!, dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() }).then(() => queryClient.invalidateQueries({ queryKey: ['invoices', id] }))} className="btn-primary text-sm">Generate Invoice</button>}
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Issued</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.invoices.map((inv: any) => {
                    const overdue = trackPayments && inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                    const statusCls =
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'EMAILED' ? 'bg-blue-100 text-blue-700' :
                      inv.status === 'PRINTED' ? 'bg-gray-100 text-gray-600' :
                      overdue ? 'bg-red-100 text-red-700' :
                      inv.status === 'CREATED' ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-100 text-amber-700';
                    const displayStatus = overdue ? 'OVERDUE' : inv.status;
                    return (
                      <tr
                        key={inv.id}
                        className="border-t border-gray-100 hover:bg-primary-50/30 cursor-pointer group transition-colors"
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 group-hover:text-primary-700">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCls}`}>{displayStatus}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-NZ') : '—'}</td>
                        <td className={`py-3 px-4 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-NZ') : '—'}
                          {overdue && <span className="ml-1 text-xs">⚠</span>}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-gray-900">${(inv.total || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedInvoiceId(inv.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                            >
                              View
                            </button>
                            {trackPayments && inv.status !== 'PAID' && (
                              <button
                                onClick={() => markPaidMutation.mutate({ invoiceId: inv.id, status: 'PAID' })}
                                disabled={markPaidMutation.isPending}
                                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                ✓ Mark Paid
                              </button>
                            )}
                            {trackPayments && inv.status === 'PAID' && (
                              <button
                                onClick={() => markPaidMutation.mutate({ invoiceId: inv.id, status: 'PENDING' })}
                                className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
                              >
                                Undo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        );
      })()}

      {costModalCategory !== null && <CostEntryModal jobId={id!} defaultCategoryName={costModalCategory || undefined} onClose={() => { setCostModalCategory(null); queryClient.invalidateQueries({ queryKey: ['costs', id] }); }} />}
      {showLaborModal && <LaborEntryModal jobId={id!} onClose={() => { setShowLaborModal(false); queryClient.invalidateQueries({ queryKey: ['labor', id] }); }} />}
      {showChangeOrderModal && <ChangeOrderModal jobId={id!} onClose={() => { setShowChangeOrderModal(false); queryClient.invalidateQueries({ queryKey: ['changeOrders', id] }); }} />}
      {selectedInvoiceId && <InvoiceViewModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />}

      {showCopyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Copy Job</h2>
            <p className="text-sm text-gray-500 mb-5">Creates a new Draft job with the same settings. Costs and labour entries are not copied.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Job Name</label>
                <input value={copyForm.name} onChange={e => setCopyForm({ ...copyForm, name: e.target.value })} className="w-full" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                <input type="date" value={copyForm.startedAt} onChange={e => setCopyForm({ ...copyForm, startedAt: e.target.value })} className="w-full" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => copyMutation.mutate({ name: copyForm.name, startedAt: copyForm.startedAt || undefined })}
                disabled={!copyForm.name.trim() || copyMutation.isPending}
                className="btn-primary flex-1"
              >
                {copyMutation.isPending ? 'Creating…' : 'Create Copy'}
              </button>
              <button onClick={() => setShowCopyModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Job Modal ── */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {completeResult ? (
              <>
                <div className="bg-emerald-600 px-6 pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-3xl">✓</div>
                  <h2 className="text-xl font-bold text-white">Job Completed!</h2>
                  <p className="text-emerald-100 text-sm mt-1">{job.name} has been marked complete.</p>
                </div>
                <div className="px-6 py-5 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions Taken</p>
                  {completeResult.actions?.map((a: any, i: number) => {
                    const icons: Record<string,string> = { invoice_created:'🧾', invoice_skipped:'➖', change_order_closed:'📝', status_updated:'✅', timestamp_set:'📅', email_sent:'📧', email_skipped:'⚠️' };
                    const cls: Record<string,string> = { invoice_created:'text-emerald-700 bg-emerald-50 border-emerald-200', email_sent:'text-blue-700 bg-blue-50 border-blue-200', email_skipped:'text-amber-700 bg-amber-50 border-amber-200' };
                    return (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm ${cls[a.type] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                        <span className="text-base">{icons[a.type] || '•'}</span>
                        <span className="flex-1">{a.label}</span>
                        {a.amount && <span className="font-bold">${a.amount.toFixed(2)}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => { setShowCompleteModal(false); setActiveTab('invoices'); }} className="btn-primary flex-1">View Invoice</button>
                  <button onClick={() => setShowCompleteModal(false)} className="btn-secondary">Close</button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-lg">✓</div>
                    <h2 className="text-lg font-bold text-gray-900">Complete Job</h2>
                  </div>
                  <p className="text-sm text-gray-500 ml-12">This will close out <strong>{job.name}</strong>. Review what will happen before confirming.</p>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What will happen</p>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-lg mt-0.5">🧾</span>
                    <div><p className="text-sm font-semibold text-gray-900">Final invoice generated</p><p className="text-xs text-gray-500">Any uninvoiced costs will be invoiced. Due in 30 days.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-lg mt-0.5">✅</span>
                    <div><p className="text-sm font-semibold text-gray-900">Status → Completed</p><p className="text-xs text-gray-500">Completion date recorded as today.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-lg mt-0.5">📝</span>
                    <div><p className="text-sm font-semibold text-gray-900">Pending change orders closed</p><p className="text-xs text-gray-500">Any unapproved change orders will be auto-rejected.</p></div>
                  </div>
                  <div
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${completeSendEmail ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                    onClick={() => setCompleteSendEmail(e => !e)}
                  >
                    <span className="text-lg">📧</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Email invoice to client</p>
                      <p className="text-xs text-gray-500">{job.client?.email ? `Sends to ${job.client.email}` : 'No client email — will be skipped'}</p>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${completeSendEmail ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${completeSendEmail ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion Notes (optional)</label>
                    <textarea
                      value={completeNotes}
                      onChange={e => setCompleteNotes(e.target.value)}
                      placeholder="e.g. All snagging items resolved. Client signed off 14 May."
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => completeMutation.mutate({ sendEmail: completeSendEmail, notes: completeNotes })}
                    disabled={completeMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    {completeMutation.isPending ? '⟳ Processing…' : '✓ Confirm & Complete Job'}
                  </button>
                  <button onClick={() => setShowCompleteModal(false)} className="btn-secondary">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
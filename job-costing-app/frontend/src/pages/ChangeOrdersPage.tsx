import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { changeOrdersApi } from '../services/api';
import { usePermission } from '../hooks/usePermission';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    PENDING:  'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };
  const icons: Record<string, string> = {
    PENDING: '⏳', APPROVED: '✅', REJECTED: '✕',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {icons[status]} {status}
    </span>
  );
}

export function ChangeOrdersPage() {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['change-orders'],
    queryFn: () => changeOrdersApi.getAll(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['change-orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
    queryClient.invalidateQueries({ queryKey: ['approvals-drill'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    setActioningId(null);
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => changeOrdersApi.approve(id),
    onSuccess: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => changeOrdersApi.reject(id),
    onSuccess: invalidateAll,
  });

  const allOrders: any[] = Array.isArray(orders) ? orders : [];

  // Stats
  const pending  = allOrders.filter(o => o.status === 'PENDING');
  const approved = allOrders.filter(o => o.status === 'APPROVED');
  const rejected = allOrders.filter(o => o.status === 'REJECTED');
  const pendingValue  = pending.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const approvedValue = approved.reduce((s: number, o: any) => s + (o.amount || 0), 0);

  const displayed = statusFilter === 'ALL' ? allOrders
    : allOrders.filter(o => o.status === statusFilter);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL',      label: 'All',      count: allOrders.length },
    { key: 'PENDING',  label: 'Pending',  count: pending.length },
    { key: 'APPROVED', label: 'Approved', count: approved.length },
    { key: 'REJECTED', label: 'Rejected', count: rejected.length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scope changes across all active jobs</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Awaiting Approval</p>
          <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
          <p className="text-sm text-amber-600 font-medium mt-0.5">${pendingValue.toLocaleString()} at risk</p>
        </div>
        <div className="card p-4 border-l-4 border-green-400">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Approved</p>
          <p className="text-2xl font-bold text-gray-900">{approved.length}</p>
          <p className="text-sm text-green-600 font-medium mt-0.5">${approvedValue.toLocaleString()} added to scope</p>
        </div>
        <div className="card p-4 border-l-4 border-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Change Orders</p>
          <p className="text-2xl font-bold text-gray-900">{allOrders.length}</p>
          <p className="text-sm text-gray-500 font-medium mt-0.5">across {new Set(allOrders.map((o: any) => o.jobId)).size} job{new Set(allOrders.map((o: any) => o.jobId)).size !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Loading change orders…</div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-gray-500 font-medium">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} change orders</p>
          {statusFilter === 'PENDING' && <p className="text-gray-400 text-sm mt-1">All change orders have been actioned 🎉</p>}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">CO #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actioned</th>
                {can('change-orders:approve') && (
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((order: any) => {
                const isActioning = actioningId === order.id;
                const isPending = order.status === 'PENDING';
                return (
                  <tr
                    key={order.id}
                    onClick={() => order.job?.id && navigate(`/jobs/${order.job.id}?tab=changeorders`)}
                    className={`group hover:bg-primary-50/40 transition-colors ${order.job?.id ? 'cursor-pointer' : ''}`}
                  >
                    {/* CO Number */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {order.orderNumber}
                      </span>
                    </td>

                    {/* Job */}
                    <td className="px-4 py-3.5">
                      {order.job ? (
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                            {order.job.name}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{order.job.jobNumber}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic text-xs">Unbound</span>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3.5">
                      <span className="text-gray-600">
                        {order.client?.name || <span className="text-gray-300 italic text-xs">—</span>}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{order.title || order.description}</p>
                      {order.title && order.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{order.description}</p>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                      <p>{fmtDate(order.submittedAt)}</p>
                      {order.submittedBy && <p className="text-xs text-gray-400">{order.submittedBy}</p>}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                      ${order.amount?.toLocaleString('en-NZ', { minimumFractionDigits: 2 }) || '0.00'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Actioned date */}
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                      {order.actionedAt ? fmtDate(order.actionedAt) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Actions */}
                    {can('change-orders:approve') && (
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => { setActioningId(order.id); approveMutation.mutate(order.id); }}
                              disabled={approveMutation.isPending && isActioning}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors border border-green-200"
                            >
                              {approveMutation.isPending && isActioning ? '…' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => { setActioningId(order.id); rejectMutation.mutate(order.id); }}
                              disabled={rejectMutation.isPending && isActioning}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors border border-red-200"
                            >
                              {rejectMutation.isPending && isActioning ? '…' : '✕ Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer summary */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {displayed.length} of {allOrders.length} change orders</span>
            {statusFilter === 'ALL' && pendingValue > 0 && (
              <span className="text-amber-600 font-semibold">
                ⚠ ${pendingValue.toLocaleString()} pending approval
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
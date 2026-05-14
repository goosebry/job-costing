import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '../services/invoices.service';
import { InvoiceViewModal } from '../components/InvoiceViewModal';
import api from '../services/api';

type SortKey = 'invoiceNumber' | 'clientName' | 'jobName' | 'issueDate' | 'dueDate' | 'total' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = ['ALL', 'CREATED', 'PRINTED', 'EMAILED', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];

const STATUS_STYLE: Record<string, string> = {
  PAID:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  EMAILED:   'bg-blue-100 text-blue-700 border-blue-200',
  SENT:      'bg-blue-100 text-blue-700 border-blue-200',
  PRINTED:   'bg-gray-100 text-gray-600 border-gray-200',
  CREATED:   'bg-gray-100 text-gray-600 border-gray-200',
  PENDING:   'bg-amber-100 text-amber-700 border-amber-200',
  OVERDUE:   'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-400 border-gray-200',
};

function fmt(n?: number) {
  return (n ?? 0).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InvoicesPage() {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('issueDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [activeTile, setActiveTile] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices-all'],
    queryFn: () => invoicesService.getInvoices(),
  });

  const allInvoices: any[] = data?.invoices ?? [];
  const trackPayments: boolean = data?.trackInvoicePayments ?? false;

  // Unique client list for filter dropdown
  const clients = useMemo(() => {
    const seen = new Map<string, string>();
    allInvoices.forEach(inv => {
      if (inv.clientName) seen.set(inv.clientName, inv.clientId ?? inv.clientName);
    });
    return Array.from(seen.entries()).map(([name, id]) => ({ name, id })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allInvoices]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let rows = allInvoices;

    // Search across invoice #, job, client
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(inv =>
        (inv.invoiceNumber ?? '').toLowerCase().includes(q) ||
        (inv.jobName ?? '').toLowerCase().includes(q) ||
        (inv.clientName ?? '').toLowerCase().includes(q)
      );
    }

    // Effective status (auto-compute OVERDUE if payment tracking on)
    const effectiveStatus = (inv: any) => {
      if (trackPayments && inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < new Date()) return 'OVERDUE';
      return inv.status;
    };

    if (statusFilter !== 'ALL') rows = rows.filter(inv => effectiveStatus(inv) === statusFilter);
    if (clientFilter !== 'ALL') rows = rows.filter(inv => inv.clientName === clientFilter);
    if (dateFrom) rows = rows.filter(inv => inv.issueDate && inv.issueDate >= dateFrom);
    if (dateTo)   rows = rows.filter(inv => inv.issueDate && inv.issueDate <= dateTo + 'T23:59:59');

    // Sort
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey] ?? '';
      let bv = b[sortKey] ?? '';
      if (sortKey === 'total') { av = Number(av); bv = Number(bv); }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return rows;
  }, [allInvoices, search, statusFilter, clientFilter, dateFrom, dateTo, sortKey, sortDir, trackPayments]);

  // Summary stats — always from the FULL dataset, not filtered
  // Tiles show grand totals; only the table below responds to filters
  const stats = useMemo(() => {
    const total   = allInvoices.reduce((s, i) => s + (i.total ?? 0), 0);
    const paid    = allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.total ?? 0), 0);
    const overdue = allInvoices.filter(i => {
      if (i.status === 'PAID') return false;
      return trackPayments && i.dueDate && new Date(i.dueDate) < new Date();
    }).reduce((s, i) => s + (i.total ?? 0), 0);
    const outstanding = total - paid;
    return { total, paid, outstanding, overdue, count: allInvoices.length };
  }, [allInvoices, trackPayments]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-gray-300 group-hover:text-gray-400">
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const markPaidMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: string }) =>
      api.patch(`/invoices/${invoiceId}/status`, { status }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices-all'] }),
  });


  const clearFilters = () => {
    setSearch(''); setStatusFilter('ALL'); setClientFilter('ALL');
    setDateFrom(''); setDateTo(''); setActiveTile(null);
  };
  const hasFilters = search || statusFilter !== 'ALL' || clientFilter !== 'ALL' || dateFrom || dateTo;

  // Tile click handler — toggle filter on/off
  const handleTileClick = (tileKey: string, status: string) => {
    if (activeTile === tileKey) {
      // Deselect
      setActiveTile(null);
      setStatusFilter('ALL');
    } else {
      setActiveTile(tileKey);
      setStatusFilter(status);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">All invoices across every job</p>
        </div>
        {trackPayments && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-medium">
            💳 Payment tracking enabled
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          {
            key: 'all',
            label: 'Total Invoiced',
            value: `$${fmt(stats.total)}`,
            valueColor: 'text-gray-900',
            bg: 'bg-white',
            activeBg: 'bg-primary-50',
            ring: 'ring-primary-400',
            status: 'ALL',
            icon: '🧾',
            sub: `${allInvoices.length} total`,
          },
          {
            key: 'paid',
            label: 'Paid',
            value: `$${fmt(stats.paid)}`,
            valueColor: 'text-emerald-700',
            bg: 'bg-emerald-50',
            activeBg: 'bg-emerald-100',
            ring: 'ring-emerald-400',
            status: 'PAID',
            icon: '✅',
            sub: `${allInvoices.filter(i => i.status === 'PAID').length} invoices`,
          },
          {
            key: 'outstanding',
            label: 'Outstanding',
            value: `$${fmt(stats.outstanding)}`,
            valueColor: 'text-amber-700',
            bg: 'bg-amber-50',
            activeBg: 'bg-amber-100',
            ring: 'ring-amber-400',
            status: 'PENDING',
            icon: '⏳',
            sub: `${allInvoices.filter(i => i.status !== 'PAID').length} unpaid`,
          },
          trackPayments
            ? {
                key: 'overdue',
                label: 'Overdue',
                value: `$${fmt(stats.overdue)}`,
                valueColor: stats.overdue > 0 ? 'text-red-700' : 'text-gray-500',
                bg: stats.overdue > 0 ? 'bg-red-50' : 'bg-white',
                activeBg: 'bg-red-100',
                ring: 'ring-red-400',
                status: 'OVERDUE',
                icon: '⚠️',
                sub: `${allInvoices.filter(i => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < new Date()).length} invoices`,
              }
            : {
                key: 'count',
                label: 'Invoices',
                value: String(stats.count),
                valueColor: 'text-gray-700',
                bg: 'bg-white',
                activeBg: 'bg-gray-100',
                ring: 'ring-gray-400',
                status: 'ALL',
                icon: '📋',
                sub: 'all jobs',
              },
        ] as const).map(tile => {
          const isActive = activeTile === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => handleTileClick(tile.key, tile.status)}
              className={[
                'card p-4 text-left w-full transition-all duration-150 focus:outline-none',
                isActive
                  ? `${tile.activeBg} ring-2 ${tile.ring} scale-[1.02] shadow-md`
                  : `${tile.bg} hover:shadow-md hover:scale-[1.01]`,
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{tile.label}</p>
                <span className="text-base">{tile.icon}</span>
              </div>
              <p className={`text-xl font-bold ${tile.valueColor}`}>{tile.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isActive ? <span className="text-primary-600 font-medium">✓ Filtered — click to clear</span> : tile.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Invoice #, job name, client…"
                className="input w-full pl-8 text-sm"
              />
            </div>
          </div>

          {/* Status */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full text-sm">
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Client</label>
            <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="input w-full text-sm">
              <option value="ALL">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Issued From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-full text-sm" />
          </div>

          {/* Date To */}
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Issued To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-full text-sm" />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 underline self-end pb-2">
              Clear filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            {search && <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">"{search}"</span>}
            {statusFilter !== 'ALL' && <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">Status: {statusFilter}</span>}
            {clientFilter !== 'ALL' && <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">Client: {clientFilter}</span>}
            {dateFrom && <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">From: {fmtDate(dateFrom)}</span>}
            {dateTo && <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full">To: {fmtDate(dateTo)}</span>}
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Loading invoices…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-600 font-medium">
            {hasFilters ? 'No invoices match your filters' : 'No invoices yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {hasFilters ? 'Try adjusting or clearing your filters.' : 'Invoices are generated from Jobs once costs are recorded.'}
          </p>
          {hasFilters && <button onClick={clearFilters} className="btn-secondary mt-4 text-sm">Clear Filters</button>}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {([
                  ['invoiceNumber', 'Invoice #'],
                  ['clientName',    'Client'],
                  ['jobName',       'Job'],
                  ['issueDate',     'Issued'],
                  ['dueDate',       'Due Date'],
                  ['total',         'Total'],
                  ['status',        'Status'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="group text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {label}<SortIcon k={key} />
                  </th>
                ))}
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const overdue = trackPayments && inv.status !== 'PAID' && inv.dueDate && new Date(inv.dueDate) < new Date();
                const displayStatus = overdue ? 'OVERDUE' : (inv.status || 'CREATED');
                const statusCls = STATUS_STYLE[displayStatus] ?? STATUS_STYLE.CREATED;

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-primary-50/30 cursor-pointer group transition-colors"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 group-hover:text-primary-700">
                      {inv.invoiceNumber || `INV-${inv.id}`}
                      {inv.isFinal && <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Final</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-medium">{inv.clientName || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>{inv.jobName || '—'}</div>
                      {inv.jobNumber && <div className="text-xs text-gray-400">{inv.jobNumber}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{fmtDate(inv.issueDate)}</td>
                    <td className={`py-3 px-4 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {fmtDate(inv.dueDate)}
                      {overdue && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">${fmt(inv.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusCls}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                          View
                        </button>
                        {trackPayments && inv.status !== 'PAID' && (
                          <button
                            onClick={() => markPaidMutation.mutate({ invoiceId: inv.id, status: 'PAID' })}
                            disabled={markPaidMutation.isPending}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            ✓ Paid
                          </button>
                        )}
                        {trackPayments && inv.status === 'PAID' && (
                          <button
                            onClick={() => markPaidMutation.mutate({ invoiceId: inv.id, status: 'PENDING' })}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
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

          {/* Footer totals row */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between text-sm text-gray-500">
            <span>{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-gray-900">Total: ${fmt(stats.total)}</span>
          </div>
        </div>
      )}

      {selectedInvoiceId && (
        <InvoiceViewModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}
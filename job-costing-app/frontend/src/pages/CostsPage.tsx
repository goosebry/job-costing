import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { costsApi } from '../services/api';

function fmt(val: any): string {
  const n = Number(val);
  return isNaN(n) ? '—' : n.toFixed(2);
}

export function CostsPage() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['costs'],
    queryFn: () => costsApi.getAll(),
  });

  // API may return { data: [], pagination: {} } or a plain array
  const costs: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.costs ?? []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Costs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{costs.length} entr{costs.length !== 1 ? 'ies' : 'y'} across all jobs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Loading cost entries…</div>
      ) : costs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🧱</p>
          <p className="text-gray-600 font-medium">No cost entries yet</p>
          <p className="text-sm text-gray-400 mt-1">Costs are added from within each job — open a job and use the Costs tab or quick actions.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Job', 'Category', 'Description', 'Vendor', 'Date', 'Amount', 'Billable'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.map((cost: any) => {
                const amount = Number(cost.totalCost ?? cost.amount ?? 0);
                return (
                  <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {cost.job?.name
                        ? <Link to={`/jobs/${cost.jobId}`} className="hover:text-primary-600">{cost.job.name}</Link>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cost.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{cost.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cost.vendor || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {cost.date ? new Date(cost.date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${fmt(amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      {cost.isBillable
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Billable</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Internal</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm text-gray-500">{costs.length} entries</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  ${fmt(costs.reduce((s, c) => s + Number(c.totalCost ?? c.amount ?? 0), 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
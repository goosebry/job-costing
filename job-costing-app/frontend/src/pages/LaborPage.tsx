import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { laborApi } from '../services/api';

function fmt(val: any): string {
  const n = Number(val);
  return isNaN(n) ? '—' : n.toFixed(2);
}

function fmtHrs(val: any): string {
  const n = Number(val);
  return isNaN(n) ? '—' : n.toLocaleString('en-NZ', { maximumFractionDigits: 2 });
}

export function LaborPage() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['labor'],
    queryFn: () => laborApi.getAll(),
  });

  // API returns { data: [], pagination: {} } — extract the array
  const labor: any[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.labor ?? []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labour</h1>
          <p className="text-sm text-gray-500 mt-0.5">{labor.length} entr{labor.length !== 1 ? 'ies' : 'y'} across all jobs</p>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Loading labour entries…</div>
      ) : labor.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">⏱️</p>
          <p className="text-gray-600 font-medium">No labour entries yet</p>
          <p className="text-sm text-gray-400 mt-1">Labour is logged from within each job — open a job and use the Labour tab.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Job', 'Worker', 'Date', 'Description', 'Hours', 'Travel', 'Rate', 'Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labor.map((entry: any) => {
                const hours = Number(entry.hoursWorked ?? 0);
                const travel = Number(entry.hoursTravel ?? 0);
                const rate = Number(entry.hourlyRate ?? 0);
                const total = Number(entry.totalCost ?? entry.total ?? (hours + travel) * rate);

                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.job?.name
                        ? <Link to={`/jobs/${entry.jobId}`} className="hover:text-primary-600">{entry.job.name}</Link>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.workerName || [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {entry.date ? new Date(entry.date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{entry.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{fmtHrs(hours)} hrs</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtHrs(travel)} hrs</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${fmt(rate)}/hr</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${fmt(total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-sm text-gray-500">{labor.length} entries</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  ${fmt(labor.reduce((s, e) => s + Number(e.totalCost ?? e.total ?? 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
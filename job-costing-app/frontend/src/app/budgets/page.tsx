'use client';

import { useEffect, useState } from 'react';
import { budgetApi } from '@/services/api';
import { useSearchParams } from 'next/navigation';

export default function BudgetsPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [budgetLines, setBudgetLines] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      const fetchBudget = async () => {
        try {
          const [linesRes, compRes] = await Promise.all([
            budgetApi.list(jobId),
            budgetApi.getComparison(jobId),
          ]);
          setBudgetLines(linesRes.data.data || []);
          setComparison(compRes.data.data);
        } catch (error) {
          console.error('Failed to fetch budget:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchBudget();
    } else {
      setLoading(false);
    }
  }, [jobId]);

  const getVarianceClass = (percent: number) => {
    if (percent >= 0) return 'text-green-600';
    if (percent >= -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <p className="page-subtitle">View budget vs actuals for your jobs</p>
      </div>

      {!jobId ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500">Select a job to view its budget comparison</p>
            <a href="/jobs" className="btn btn-primary mt-4">Go to Jobs</a>
          </div>
        </div>
      ) : loading ? (
        <div className="card"><div className="p-8 text-center"><div className="spinner mx-auto" /></div></div>
      ) : !comparison?.lines?.length ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500">No budget lines defined for this job</p>
            <a href={`/jobs/${jobId}`} className="btn btn-primary mt-4">Configure Budget</a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Budget vs Actuals</h2></div>
            <div className="card-body p-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Budgeted</th>
                    <th className="text-right">Committed</th>
                    <th className="text-right">Actual Spent</th>
                    <th className="text-right">Variance</th>
                    <th className="text-right">%</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.lines.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td>{line.category}</td>
                      <td className="text-right">${line.budgeted.toLocaleString()}</td>
                      <td className="text-right">${line.committed.toLocaleString()}</td>
                      <td className="text-right">${line.actualSpent.toLocaleString()}</td>
                      <td className={`text-right font-medium ${getVarianceClass(line.variancePercent)}`}>
                        ${line.variance.toLocaleString()}
                      </td>
                      <td className={`text-right ${getVarianceClass(line.variancePercent)}`}>
                        {line.variancePercent.toFixed(1)}%
                      </td>
                      <td>
                        <span className={`badge ${line.status === 'on_track' ? 'badge-success' : line.status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                          {line.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td>Total</td>
                    <td className="text-right">${comparison.totals.budgeted.toLocaleString()}</td>
                    <td className="text-right">${comparison.totals.committed.toLocaleString()}</td>
                    <td className="text-right">${comparison.totals.actualSpent.toLocaleString()}</td>
                    <td className={`text-right ${getVarianceClass(comparison.totals.variancePercent)}`}>
                      ${comparison.totals.variance.toLocaleString()}
                    </td>
                    <td className={`text-right ${getVarianceClass(comparison.totals.variancePercent)}`}>
                      {comparison.totals.variancePercent.toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">${comparison.totals.budgeted.toLocaleString()}</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${comparison.totals.actualSpent.toLocaleString()}</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`text-2xl font-bold ${getVarianceClass(comparison.totals.variancePercent)}`}>
                ${(comparison.totals.budgeted - comparison.totals.actualSpent).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
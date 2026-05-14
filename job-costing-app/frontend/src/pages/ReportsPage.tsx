import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';
import { usePermission } from '../hooks/usePermission';
import api from '../services/api';

export function ReportsPage() {
  const canExport = usePermission('reports:export');
  const [activeReport, setActiveReport] = useState<'executive' | 'profitability' | 'labor' | 'cashflow' | 'wip'>('executive');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const { data: executiveReport, isLoading: loadingExecutive } = useQuery({
    queryKey: ['reports', 'executive', dateRange],
    queryFn: () => reportsService.getExecutiveSummary(dateRange),
    enabled: activeReport === 'executive',
  });

  const { data: profitabilityReport, isLoading: loadingProfitability } = useQuery({
    queryKey: ['reports', 'profitability', dateRange],
    queryFn: () => reportsService.getProfitabilityReport(dateRange),
    enabled: activeReport === 'profitability',
  });

  const { data: laborReport, isLoading: loadingLabor } = useQuery({
    queryKey: ['reports', 'labor', dateRange],
    queryFn: () => reportsService.getLaborUtilization(dateRange),
    enabled: activeReport === 'labor',
  });

  const { data: cashFlowReport, isLoading: loadingCashFlow } = useQuery({
    queryKey: ['reports', 'cashflow', dateRange],
    queryFn: () => reportsService.getCashFlowReport(dateRange),
    enabled: activeReport === 'cashflow',
  });

  const { data: wipReport, isLoading: loadingWip } = useQuery({
    queryKey: ['reports', 'wip'],
    queryFn: async () => { const r = await api.get('/reports/wip'); return r.data; },
    enabled: activeReport === 'wip',
  });

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        {canExport && (
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">Export CSV</button>
            <button className="btn-secondary text-sm">Export PDF</button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-1">Start Date</label>
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-full" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-1">End Date</label>
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-full" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'executive', label: 'Executive Summary' },
          { id: 'profitability', label: 'Profitability' },
          { id: 'labor', label: 'Labor Utilization' },
          { id: 'cashflow', label: 'Cash Flow' },
          { id: 'wip', label: '📊 WIP Report' },
        ].map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeReport === report.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {report.label}
          </button>
        ))}
      </div>

      {activeReport === 'executive' && (
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Executive Summary</h2>
          {loadingExecutive ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : executiveReport?.jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-xl font-bold">{formatCurrency(executiveReport?.totals.estimatedBudget || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-xl font-bold">{formatCurrency(executiveReport?.totals.totalActual || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(executiveReport?.totals.revenue || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Variance</p>
                  <p className={`text-xl font-bold ${(executiveReport?.totals.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(executiveReport?.totals.variance || 0)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Job</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Budget</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Costs</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Labor</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Change Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executiveReport?.jobs.map((job) => (
                      <tr key={job.jobId} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <p className="font-medium">{job.jobName}</p>
                          <p className="text-sm text-gray-500">{job.jobNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-right">{formatCurrency(job.estimatedBudget)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(job.totalCosts)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(job.totalLabor)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(job.totalChangeOrders)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${job.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(job.variance)} ({formatPercent(job.variancePercent)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === 'profitability' && (
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Profitability Report</h2>
          {loadingProfitability ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Job</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Costs</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Labor</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Gross Profit</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {profitabilityReport?.jobs.map((job: any) => (
                    <tr key={job.jobId} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium">{job.jobName}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(job.revenue)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(job.costs)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(job.labor)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${job.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(job.grossProfit)}
                      </td>
                      <td className={`py-3 px-4 text-right ${job.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(job.margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeReport === 'labor' && (
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Labor Utilization</h2>
          {loadingLabor ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Workers</p>
                  <p className="text-xl font-bold">{laborReport?.totals.workersCount || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="text-xl font-bold">{laborReport?.totals.totalHours?.toFixed(1) || 0}h</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(laborReport?.totals.totalCost || 0)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Worker</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total Hours</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total Cost</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborReport?.byWorker.map((worker: any) => (
                      <tr key={worker.workerName} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{worker.workerName}</td>
                        <td className="py-3 px-4 text-right">{worker.totalHours.toFixed(1)}h</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(worker.totalCost)}</td>
                        <td className="py-3 px-4 text-right">{worker.entriesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeReport === 'cashflow' && (
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Cash Flow Report</h2>
          {loadingCashFlow ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Total Outflows</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(cashFlowReport?.summary.totalOutflows || 0)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total Inflows</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(cashFlowReport?.summary.totalInflows || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Net Cash Flow</p>
                  <p className={`text-xl font-bold ${(cashFlowReport?.summary.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlowReport?.summary.netCashFlow || 0)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Report generated: {cashFlowReport?.generatedAt ? new Date(cashFlowReport.generatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          )}
        </div>
      )}

      {activeReport === 'wip' && (
        <div className="card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Work-in-Progress (WIP) Report</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Shows earned revenue vs billed amounts to identify over- or under-billing on active jobs.
              </p>
            </div>
            {wipReport?.generatedAt && (
              <span className="text-xs text-gray-400">Generated {new Date(wipReport.generatedAt).toLocaleString()}</span>
            )}
          </div>

          {loadingWip ? (
            <div className="text-center py-8 text-gray-400">Loading WIP data…</div>
          ) : !wipReport || wipReport.rows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No active jobs to report on</div>
          ) : (
            <>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-3 font-medium text-gray-500">Job</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500">Client</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">Contract Value</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">Costs to Date</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">% Complete</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">Earned Revenue</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">Billed to Date</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">Over / Under Billing</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {wipReport.rows.map((row: any) => (
                      <tr key={row.jobId} className="hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <p className="font-medium text-gray-900">{row.jobName}</p>
                          <p className="text-xs text-gray-400">{row.jobNumber}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{row.clientName || '—'}</td>
                        <td className="py-3 px-3 text-right font-medium">{formatCurrency(row.contractValue)}</td>
                        <td className="py-3 px-3 text-right">{formatCurrency(row.totalCostsToDate)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-primary-500"
                                style={{ width: `${Math.min(row.pctComplete, 100)}%` }}
                              />
                            </div>
                            <span>{row.pctComplete}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">{formatCurrency(row.earnedRevenue)}</td>
                        <td className="py-3 px-3 text-right">{formatCurrency(row.billedToDate)}</td>
                        <td className={`py-3 px-3 text-right font-semibold ${row.overUnderBilling > 0 ? 'text-green-600' : row.overUnderBilling < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {row.overUnderBilling >= 0 ? '+' : ''}{formatCurrency(row.overUnderBilling)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.billingStatus === 'over_billed' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Over-billed</span>
                          )}
                          {row.billingStatus === 'under_billed' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Under-billed</span>
                          )}
                          {row.billingStatus === 'balanced' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">Balanced</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <tr>
                      <td className="py-3 px-3 text-gray-700" colSpan={2}>Totals</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(wipReport.totals.contractValue)}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(wipReport.totals.totalCostsToDate)}</td>
                      <td />
                      <td className="py-3 px-3 text-right">{formatCurrency(wipReport.totals.earnedRevenue)}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(wipReport.totals.billedToDate)}</td>
                      <td className={`py-3 px-3 text-right ${wipReport.totals.overUnderBilling >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {wipReport.totals.overUnderBilling >= 0 ? '+' : ''}{formatCurrency(wipReport.totals.overUnderBilling)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Billing status summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm font-medium text-blue-800 mb-1">📋 How to read this report</p>
                <p className="text-xs text-blue-700">
                  <strong>Earned Revenue</strong> = % Complete × Contract Value (cost-to-cost method).{' '}
                  <strong>Over-billed</strong> means you've invoiced more than earned — good for cash flow, but a liability on your balance sheet.{' '}
                  <strong>Under-billed</strong> means you've earned more than invoiced — send more invoices!
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
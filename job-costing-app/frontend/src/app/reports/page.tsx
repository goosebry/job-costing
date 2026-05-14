'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/services/api';

const reportTypes = [
  { id: 'job_pl', name: 'Job P&L Report', description: 'Profit and Loss for a specific job' },
  { id: 'cost_vs_budget', name: 'Cost vs Budget', description: 'Compare actual costs against budget' },
  { id: 'labor_utilization', name: 'Labor Utilization', description: 'Track labor hours and productivity' },
  { id: 'wip_summary', name: 'WIP Summary', description: 'Work in Progress across all active jobs' },
  { id: 'job_status', name: 'Job Status Dashboard', description: 'Overview of all jobs by status' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('');
  const [jobId, setJobId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!reportType) return;
    setLoading(true);
    try {
      const response = await reportsApi.generate({
        type: reportType,
        jobId: jobId || undefined,
        format: 'json',
      });
      setReport(response.data.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and view job costing reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Report Options</h2></div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label htmlFor="reportType" className="form-label">Report Type</label>
                <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)} className="form-input">
                  <option value="">Select report...</option>
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {reportType && <p className="text-xs text-gray-500 mt-1">{reportTypes.find(t => t.id === reportType)?.description}</p>}
              </div>

              {(reportType === 'job_pl' || reportType === 'cost_vs_budget' || reportType === 'labor_utilization') && (
                <div className="form-group">
                  <label htmlFor="jobId" className="form-label">Job ID</label>
                  <input id="jobId" type="text" value={jobId} onChange={(e) => setJobId(e.target.value)} className="form-input" placeholder="Enter job ID" />
                </div>
              )}

              <button onClick={generateReport} disabled={!reportType || loading} className="btn btn-primary w-full">
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          <div className="card mt-6">
            <div className="card-header"><h2 className="font-semibold">Available Reports</h2></div>
            <div className="card-body space-y-2">
              {reportTypes.map((type) => (
                <div key={type.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => setReportType(type.id)}>
                  <p className="font-medium text-sm">{type.name}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="font-semibold">Report Output</h2>
              {report && (
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-secondary">Export CSV</button>
                  <button className="btn btn-sm btn-secondary">Export PDF</button>
                </div>
              )}
            </div>
            <div className="card-body">
              {!report ? (
                <p className="text-gray-500 text-center py-12">Select a report type and generate to view results</p>
              ) : (
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">{JSON.stringify(report, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
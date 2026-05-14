'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobsApi } from '@/services/api';
import { format } from 'date-fns';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'costs', label: 'Costs' },
  { id: 'labor', label: 'Labor' },
  { id: 'budget', label: 'Budget' },
  { id: 'change-orders', label: 'Change Orders' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'activity', label: 'Activity' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'badge-neutral', PROPOSED: 'badge-info', ACTIVE: 'badge-success',
  COMPLETED: 'badge-warning', CANCELLED: 'badge-danger',
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobsApi.get(jobId);
        setJob(response.data.data);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  if (!job) {
    return <div className="text-center py-8 text-gray-500">Job not found</div>;
  }

  return (
    <div>
      <div className="page-header flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/jobs" className="text-gray-400 hover:text-gray-600">← Jobs</Link>
            <h1 className="page-title">Job #{job.jobNumber}</h1>
            <span className={`badge ${statusColors[job.status]}`}>{job.status}</span>
          </div>
          <p className="text-xl font-medium text-gray-900 mt-2">{job.name}</p>
        </div>
        <Link href={`/jobs/${jobId}/edit`} className="btn btn-primary">Edit Job</Link>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 border-b-2 text-sm font-medium ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab job={job} />}
      {activeTab === 'costs' && <CostsTab job={job} jobId={jobId} />}
      {activeTab === 'labor' && <LaborTab job={job} jobId={jobId} />}
      {activeTab === 'budget' && <BudgetTab jobId={jobId} />}
      {activeTab === 'change-orders' && <ChangeOrdersTab jobId={jobId} />}
      {activeTab === 'invoices' && <InvoicesTab jobId={jobId} />}
      {activeTab === 'activity' && <ActivityTab job={job} />}
    </div>
  );
}

function OverviewTab({ job }: { job: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-header"><h2 className="font-semibold">Job Details</h2></div>
        <div className="card-body space-y-4">
          <div><span className="text-sm text-gray-500">Description</span><p className="mt-1">{job.description || 'No description'}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Customer</span><p className="mt-1">{job.customerName || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Contact</span><p className="mt-1">{job.customerContact || '-'}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Start Date</span><p className="mt-1">{job.startDate ? format(new Date(job.startDate), 'MMM d, yyyy') : '-'}</p></div>
            <div><span className="text-sm text-gray-500">End Date</span><p className="mt-1">{job.endDate ? format(new Date(job.endDate), 'MMM d, yyyy') : '-'}</p></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2 className="font-semibold">Summary</h2></div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{job._count?.costEntries || 0}</p>
              <p className="text-sm text-gray-500">Cost Entries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{job._count?.laborEntries || 0}</p>
              <p className="text-sm text-gray-500">Labor Entries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{job._count?.changeOrders || 0}</p>
              <p className="text-sm text-gray-500">Change Orders</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{job._count?.invoices || 0}</p>
              <p className="text-sm text-gray-500">Invoices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostsTab({ job, jobId }: { job: any; jobId: string }) {
  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2 className="font-semibold">Cost Entries</h2>
        <Link href={`/costs/new?jobId=${jobId}`} className="btn btn-sm btn-primary">Add Cost</Link>
      </div>
      <div className="card-body">
        {!job.costEntries?.length ? (
          <p className="text-gray-500 text-center py-8">No cost entries yet</p>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {job.costEntries.map((entry: any) => (
                <tr key={entry.id}>
                  <td>{format(new Date(entry.createdAt), 'MMM d, yyyy')}</td>
                  <td>{entry.category?.name}</td>
                  <td>{entry.description || '-'}</td>
                  <td className="font-medium">${Number(entry.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function LaborTab({ job, jobId }: { job: any; jobId: string }) {
  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2 className="font-semibold">Labor Entries</h2>
        <Link href={`/labor/new?jobId=${jobId}`} className="btn btn-sm btn-primary">Add Labor</Link>
      </div>
      <div className="card-body">
        {!job.laborEntries?.length ? (
          <p className="text-gray-500 text-center py-8">No labor entries yet</p>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Worker</th><th>Hours Worked</th><th>Hours Travel</th><th>Status</th></tr></thead>
            <tbody>
              {job.laborEntries.map((entry: any) => (
                <tr key={entry.id}>
                  <td>{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                  <td>{entry.user?.firstName} {entry.user?.lastName}</td>
                  <td>{entry.hoursWorked}</td>
                  <td>{entry.hoursTravel}</td>
                  <td><span className={`badge ${entry.approvalStatus === 'APPROVED' ? 'badge-success' : entry.approvalStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{entry.approvalStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BudgetTab({ jobId }: { jobId: string }) {
  return <div className="card"><div className="card-body"><p className="text-gray-500">Budget comparison coming soon</p></div></div>;
}

function ChangeOrdersTab({ jobId }: { jobId: string }) {
  return <div className="card"><div className="card-body"><p className="text-gray-500">Change orders coming soon</p></div></div>;
}

function InvoicesTab({ jobId }: { jobId: string }) {
  return <div className="card"><div className="card-body"><p className="text-gray-500">Invoices coming soon</p></div></div>;
}

function ActivityTab({ job }: { job: any }) {
  return <div className="card"><div className="card-body"><p className="text-gray-500">Activity feed coming soon</p></div></div>;
}
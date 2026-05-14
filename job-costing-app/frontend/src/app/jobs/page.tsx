'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { jobsApi } from '@/services/api';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  DRAFT: 'badge-neutral',
  PROPOSED: 'badge-info',
  ACTIVE: 'badge-success',
  COMPLETED: 'badge-warning',
  CANCELLED: 'badge-danger',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await jobsApi.list({ page, limit: 20, search, status: status || undefined });
        setJobs(response.data.data || []);
        setPagination(response.data.pagination || { total: 0, totalPages: 0 });
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [page, search, status]);

  return (
    <div>
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Manage your construction and project jobs</p>
        </div>
        <Link href="/jobs/new" className="btn btn-primary">Create Job</Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body flex gap-4">
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input flex-1"
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input w-48">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PROPOSED">Proposed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No jobs found. Create your first job to get started.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Job #</th>
                <th>Name</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="font-medium">{job.jobNumber}</td>
                  <td>
                    <Link href={`/jobs/${job.id}`} className="text-primary-600 hover:underline">
                      {job.name}
                    </Link>
                  </td>
                  <td>{job.customerName || '-'}</td>
                  <td>
                    <span className={`badge ${statusColors[job.status] || 'badge-neutral'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.startDate ? format(new Date(job.startDate), 'MMM d, yyyy') : '-'}</td>
                  <td>
                    <Link href={`/jobs/${job.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">
            Previous
          </button>
          <span className="px-4 py-2">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages} className="btn btn-secondary">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
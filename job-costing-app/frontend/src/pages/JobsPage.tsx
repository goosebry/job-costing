import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsService, Job, JobFilters } from '../services/jobs.service';
import { usePermission } from '../hooks/usePermission';
import { useJobStatuses } from '../hooks/useJobStatuses';

export function JobsPage() {
  const navigate = useNavigate();
  const canCreateJob = usePermission('jobs:create');
  const [filters, setFilters] = useState<JobFilters>({ page: 1, limit: 20 });
  const { statuses, getBadgeStyle, getLabel } = useJobStatuses();

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const result = await jobsService.getJobs(filters);
      // Demo server returns a flat array; normalize to { data, pagination } shape
      if (Array.isArray(result)) {
        return { data: result as any[], pagination: null };
      }
      return result as any;
    },
  });

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status || undefined, page: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        {canCreateJob && (
          <Link to="/jobs/new" className="btn-primary">
            + New Job
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search jobs..."
            className="flex-1"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="sm:w-48"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading jobs...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">Failed to load jobs</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No jobs found. {canCreateJob && <Link to="/jobs/new" className="text-primary-600 hover:underline">Create your first job</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Job #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Budget</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 text-sm">{job.jobNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{job.name}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{job.clientName || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium border"
                        style={getBadgeStyle(job.status)}
                      >
                        {getLabel(job.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">${(job.estimatedBudget || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
              {data.pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                disabled={filters.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                disabled={filters.page === data.pagination.totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
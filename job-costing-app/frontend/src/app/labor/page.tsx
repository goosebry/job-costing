'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { laborApi } from '@/services/api';
import { format } from 'date-fns';

export default function LaborPage() {
  const { user, hasPermission } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchLabor = async () => {
      try {
        const response = await laborApi.list({ page, limit: 20, status: status || undefined });
        setEntries(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch labor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabor();
  }, [page, status]);

  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Labor Timesheets</h1>
          <p className="page-subtitle">Track and manage labor hours</p>
        </div>
        <a href="/labor/new" className="btn btn-primary">Log Labor</a>
      </div>

      <div className="card mb-6">
        <div className="card-body flex gap-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input w-48">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No labor entries found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Job</th>
                <th>Worker</th>
                <th>Hours Worked</th>
                <th>Hours Travel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                  <td>{entry.job?.name || '-'}</td>
                  <td>{entry.user?.firstName} {entry.user?.lastName}</td>
                  <td>{entry.hoursWorked}h</td>
                  <td>{entry.hoursTravel}h</td>
                  <td>
                    <span className={`badge ${statusColors[entry.approvalStatus]}`}>
                      {entry.approvalStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">Previous</button>
        <button onClick={() => setPage(p => p + 1)} className="btn btn-secondary">Next</button>
      </div>
    </div>
  );
}
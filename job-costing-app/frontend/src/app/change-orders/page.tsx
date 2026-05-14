'use client';

import { useEffect, useState } from 'react';
import { changeOrdersApi } from '@/services/api';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  DRAFT: 'badge-neutral',
  PENDING_APPROVAL: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
};

export default function ChangeOrdersPage() {
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchChangeOrders = async () => {
      try {
        const response = await changeOrdersApi.list({ page, limit: 20, status: status || undefined });
        setChangeOrders(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch change orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChangeOrders();
  }, [page, status]);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Change Orders</h1>
          <p className="page-subtitle">Manage scope changes and budget amendments</p>
        </div>
        <a href="/change-orders/new" className="btn btn-primary">Create Change Order</a>
      </div>

      <div className="card mb-6">
        <div className="card-body flex gap-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input w-48">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : changeOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No change orders found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Job</th>
                <th>Requested By</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {changeOrders.map((co) => (
                <tr key={co.id}>
                  <td className="font-medium">{co.title}</td>
                  <td>{co.job?.name || '-'}</td>
                  <td>{co.requestedBy?.firstName} {co.requestedBy?.lastName}</td>
                  <td className="font-medium">${Number(co.amount).toLocaleString()}</td>
                  <td><span className={`badge ${statusColors[co.status]}`}>{co.status.replace('_', ' ')}</span></td>
                  <td>{format(new Date(co.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
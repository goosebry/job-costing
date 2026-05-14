'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { notificationsApi } from '@/services/api';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { hasPermission } = useAuthStore();
  const [laborApprovals, setLaborApprovals] = useState<any[]>([]);
  const [changeOrderApprovals, setChangeOrderApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const [laborRes, changeRes] = await Promise.all([
          hasPermission('labor:approve') ? laborApi.getPending() : Promise.resolve({ data: { data: [] } }),
          hasPermission('change-orders:approve') ? changeOrdersApi.getPending() : Promise.resolve({ data: { data: [] } }),
        ]);
        setLaborApprovals(laborRes.data.data || []);
        setChangeOrderApprovals(changeRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, [hasPermission]);

  const handleApprove = async (type: 'labor' | 'changeOrder', id: string) => {
    try {
      if (type === 'labor') {
        await laborApi.approve(id, { status: 'APPROVED' });
        setLaborApprovals(laborApprovals.filter(l => l.id !== id));
      } else {
        await changeOrdersApi.approve(id, { status: 'APPROVED' });
        setChangeOrderApprovals(changeOrderApprovals.filter(co => co.id !== id));
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (type: 'labor' | 'changeOrder', id: string) => {
    try {
      if (type === 'labor') {
        await laborApi.approve(id, { status: 'REJECTED' });
        setLaborApprovals(laborApprovals.filter(l => l.id !== id));
      } else {
        await changeOrdersApi.approve(id, { status: 'REJECTED' });
        setChangeOrderApprovals(changeOrderApprovals.filter(co => co.id !== id));
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  const totalPending = laborApprovals.length + changeOrderApprovals.length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Approvals</h1>
        <p className="page-subtitle">Review and approve pending labor entries and change orders</p>
      </div>

      {totalPending === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500 text-lg">No pending approvals</p>
            <p className="text-sm text-gray-400 mt-2">All caught up! Check back later for new submissions.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {laborApprovals.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">Pending Labor ({laborApprovals.length})</h2>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Job</th>
                      <th>Worker</th>
                      <th>Hours Worked</th>
                      <th>Hours Travel</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborApprovals.map((entry) => (
                      <tr key={entry.id}>
                        <td>{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                        <td>{entry.job?.name || '-'}</td>
                        <td>{entry.user?.firstName} {entry.user?.lastName}</td>
                        <td>{entry.hoursWorked}</td>
                        <td>{entry.hoursTravel}</td>
                        <td className="flex gap-2">
                          <button onClick={() => handleApprove('labor', entry.id)} className="btn btn-sm btn-primary">Approve</button>
                          <button onClick={() => handleReject('labor', entry.id)} className="btn btn-sm btn-danger">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {changeOrderApprovals.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">Pending Change Orders ({changeOrderApprovals.length})</h2>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Job</th>
                      <th>Requested By</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeOrderApprovals.map((co) => (
                      <tr key={co.id}>
                        <td>{co.title}</td>
                        <td>{co.job?.name || '-'}</td>
                        <td>{co.requestedBy?.firstName} {co.requestedBy?.lastName}</td>
                        <td className="font-medium">${Number(co.amount).toLocaleString()}</td>
                        <td className="flex gap-2">
                          <button onClick={() => handleApprove('changeOrder', co.id)} className="btn btn-sm btn-primary">Approve</button>
                          <button onClick={() => handleReject('changeOrder', co.id)} className="btn btn-sm btn-danger">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
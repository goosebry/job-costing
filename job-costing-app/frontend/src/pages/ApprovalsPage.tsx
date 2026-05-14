import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeOrdersApi } from '../services/api';
import { usePermission } from '../hooks/usePermission';

export function ApprovalsPage() {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: () => changeOrdersApi.getPending(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => changeOrdersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => changeOrdersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  if (!can('change-orders:approve')) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">You do not have permission to view approvals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Approvals</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading approvals...</div>
      ) : pendingApprovals && pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          {pendingApprovals.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Job: {item.job?.name} | Type: {item.type}
                  </p>
                  <p className="text-gray-700 mt-3">{item.description}</p>
                  <div className="mt-4 flex gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Requested Amount</p>
                      <p className="text-xl font-semibold text-gray-900">${item.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested By</p>
                      <p className="text-sm text-gray-900">{item.requestedByUser?.firstName} {item.requestedByUser?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested At</p>
                      <p className="text-sm text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(item.id)}
                    disabled={rejectMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No pending approvals</p>
        </div>
      )}
    </div>
  );
}
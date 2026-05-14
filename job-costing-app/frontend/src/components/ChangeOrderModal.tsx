import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changeOrdersService, CreateChangeOrderRequest } from '../services/change-orders.service';

interface ChangeOrderModalProps {
  jobId: string;
  onClose: () => void;
}

export function ChangeOrderModal({ jobId, onClose }: ChangeOrderModalProps) {
  const [formData, setFormData] = useState<Partial<CreateChangeOrderRequest>>({
    jobId,
    description: '',
    amount: 0,
    isCommitted: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateChangeOrderRequest) => changeOrdersService.createChangeOrder(data),
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData as CreateChangeOrderRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Change Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-24" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
            <input type="number" min="0" step="0.01" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="w-full" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.isCommitted} onChange={(e) => setFormData({ ...formData, isCommitted: e.target.checked })} />
            <span className="text-sm">Committed (already approved)</span>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Saving...' : 'Create Change Order'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
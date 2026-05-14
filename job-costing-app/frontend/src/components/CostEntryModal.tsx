import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { costsService, CostCategory, CreateCostRequest } from '../services/costs.service';

interface CostEntryModalProps {
  jobId: string;
  onClose: () => void;
}

export function CostEntryModal({ jobId, onClose }: CostEntryModalProps) {
  const [formData, setFormData] = useState<Partial<CreateCostRequest>>({
    jobId,
    description: '',
    quantity: 1,
    unitCost: 0,
    dateIncurred: new Date().toISOString(),
    isBillable: true,
    isCommitted: false,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => costsService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCostRequest) => costsService.createCost(data),
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return;
    createMutation.mutate(formData as CreateCostRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Cost Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full" required>
              <option value="">Select category</option>
              {categories?.map((cat: CostCategory) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="0" step="0.01" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
              <input type="number" min="0" step="0.01" value={formData.unitCost || ''} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })} className="w-full" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input value={formData.vendor || ''} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Incurred</label>
            <input type="date" value={formData.dateIncurred?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, dateIncurred: new Date(e.target.value).toISOString() })} className="w-full" required />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isBillable} onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })} />
              <span className="text-sm">Billable</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isCommitted} onChange={(e) => setFormData({ ...formData, isCommitted: e.target.checked })} />
              <span className="text-sm">Committed</span>
            </label>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Saving...' : 'Save Cost'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
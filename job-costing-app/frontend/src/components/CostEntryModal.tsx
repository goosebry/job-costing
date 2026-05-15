import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { costsService, CostCategory, CreateCostRequest } from '../services/costs.service';

interface CostEntryModalProps {
  jobId: string;
  onClose: () => void;
  /** Pre-select a category by matching its name (case-insensitive substring) */
  defaultCategoryName?: string;
}

export function CostEntryModal({ jobId, onClose, defaultCategoryName }: CostEntryModalProps) {
  const [formData, setFormData] = useState<Partial<CreateCostRequest>>({
    jobId,
    description: '',
    quantity: 1,
    unitCost: 0,
    date: new Date().toISOString().split('T')[0],
    isBillable: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => costsService.getCategories(),
  });

  // Auto-select category once categories load
  useEffect(() => {
    if (!categories || !defaultCategoryName || formData.categoryId) return;
    const match = categories.find((c: CostCategory) =>
      c.name.toLowerCase().includes(defaultCategoryName.toLowerCase())
    );
    if (match) {
      setFormData(prev => ({ ...prev, categoryId: match.id }));
    }
  }, [categories, defaultCategoryName]);

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

  // Title changes based on pre-selected category
  const modalTitle = defaultCategoryName
    ? `Add ${defaultCategoryName}`
    : 'Add Cost Entry';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full"
              required
            >
              <option value="">Select category</option>
              {categories?.map((cat: CostCategory) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full"
              placeholder={defaultCategoryName === 'Materials' ? 'e.g. Timber, concrete, fasteners…' : defaultCategoryName === 'Subcontractor' ? 'e.g. Electrical work, plumbing…' : 'Description'}
              required
              autoFocus={!defaultCategoryName}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost || ''}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                className="w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Supplier</label>
            <input
              value={formData.vendor || ''}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full"
              placeholder="e.g. Mitre 10, PlaceMakers…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date?.split('T')[0] || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
            />
            <label htmlFor="billable" className="text-sm text-gray-700">Billable to client</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending || !formData.categoryId} className="btn-primary flex-1">
              {createMutation.isPending ? 'Saving…' : 'Save Cost'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-600 text-center">Failed to save — please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}
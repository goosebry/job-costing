import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costsService, CostCategory } from '../../services/costs.service';

export function CostCategoriesSettings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', unitType: 'unit' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => costsService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; unitType: string }) => costsService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setFormData({ name: '', description: '', unitType: 'unit' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Cost Categories</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Category</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Name</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full" required />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Unit Type</label>
            <input value={formData.unitType} onChange={(e) => setFormData({ ...formData, unitType: e.target.value })} className="w-full" placeholder="e.g., unit, hour, sq ft" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No categories defined yet</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 text-sm font-medium text-gray-500">Unit Type</th>
              <th className="text-left py-3 text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((cat: CostCategory) => (
              <tr key={cat.id} className="border-b border-gray-100">
                <td className="py-3">{cat.name}</td>
                <td className="py-3 text-gray-600">{cat.unitType}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
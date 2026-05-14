import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { laborService, CreateLaborRequest } from '../services/labor.service';

interface LaborEntryModalProps {
  jobId: string;
  onClose: () => void;
}

export function LaborEntryModal({ jobId, onClose }: LaborEntryModalProps) {
  const [formData, setFormData] = useState<Partial<CreateLaborRequest>>({
    jobId,
    workerName: '',
    role: '',
    hoursWorked: 8,
    hourlyRate: 0,
    hoursTravel: 0,
    date: new Date().toISOString(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLaborRequest) => laborService.createLabor(data),
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData as CreateLaborRequest);
  };

  const totalCost = ((formData.hoursWorked || 0) * (formData.hourlyRate || 0)) + ((formData.hoursTravel || 0) * 0.5 * (formData.hourlyRate || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Labor Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name *</label>
            <input value={formData.workerName || ''} onChange={(e) => setFormData({ ...formData, workerName: e.target.value })} className="w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <input value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full" placeholder="e.g., Electrician, Plumber" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
              <input type="number" min="0" step="0.5" value={formData.hoursWorked || ''} onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Travel</label>
              <input type="number" min="0" step="0.5" value={formData.hoursTravel || ''} onChange={(e) => setFormData({ ...formData, hoursTravel: parseFloat(e.target.value) })} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
            <input type="number" min="0" step="0.01" value={formData.hourlyRate || ''} onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })} className="w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={formData.date?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })} className="w-full" required />
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Estimated Total</p>
            <p className="text-xl font-bold">${totalCost.toFixed(2)}</p>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Saving...' : 'Save Labor'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
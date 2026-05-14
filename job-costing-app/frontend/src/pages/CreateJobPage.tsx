import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { jobsService, CreateJobRequest } from '../services/jobs.service';
import { clientsService } from '../services/clients.service';
import { usePermission } from '../hooks/usePermission';
import { useJobStatuses } from '../hooks/useJobStatuses';

export function CreateJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canCreateJob = usePermission('jobs:create');
  const { statuses } = useJobStatuses();

  const prefilledClientId = searchParams.get('clientId') || '';

  const [formData, setFormData] = useState<CreateJobRequest>({
    name: '',
    description: '',
    clientId: prefilledClientId || undefined,
    clientName: '',
    estimatedBudget: undefined,
    status: 'DRAFT',
  });
  const [error, setError] = useState('');

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => jobsService.getTemplates(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJobRequest) => jobsService.createJob(data),
    onSuccess: (job) => navigate(`/jobs/${job.id}`),
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to create job'),
  });

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) { setFormData({ ...formData, templateId: undefined }); return; }
    const tmpl = templates?.find((t: any) => t.id === templateId);
    if (tmpl) {
      setFormData({
        ...formData,
        templateId,
        name: formData.name || tmpl.name,
        description: formData.description || tmpl.description || '',
        estimatedBudget: formData.estimatedBudget || tmpl.estimatedBudget,
      });
    }
  };

  const handleClientChange = (clientId: string) => {
    if (!clientId) { setFormData({ ...formData, clientId: undefined, clientName: '' }); return; }
    const client = clients.find(c => c.id === clientId);
    setFormData({ ...formData, clientId, clientName: client?.name || '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate(formData);
  };

  if (!canCreateJob) {
    return <div className="text-center py-12">You do not have permission to create jobs</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Job</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {/* Template picker — appears first to pre-fill fields */}
          {templates && templates.length > 0 && (
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Start from Template <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select id="template" onChange={(e) => handleTemplateChange(e.target.value)} className="w-full">
                <option value="">No template — blank job</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}{t.estimatedBudget ? ` — $${Number(t.estimatedBudget).toLocaleString()}` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Selecting a template will pre-fill the name, description and budget.</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Job Name *</label>
            <input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full" required />
          </div>

          {/* Client binding */}
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {clients.length > 0 ? (
              <select id="client" value={formData.clientId || ''} onChange={(e) => handleClientChange(e.target.value)} className="w-full">
                <option value="">Unbound — no client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.contactName ? ` · ${c.contactName}` : ''}</option>
                ))}
              </select>
            ) : (
              <input
                id="clientName"
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Client name (free text)"
                className="w-full"
              />
            )}
            {clients.length > 0 && !formData.clientId && (
              <p className="text-xs text-gray-400 mt-1">
                Or <button type="button" onClick={() => navigate('/clients')} className="text-primary-600 hover:underline">manage clients</button>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-24" />
          </div>

          <div>
            <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
            <input id="estimatedBudget" type="number" min="0" step="0.01" value={formData.estimatedBudget || ''} onChange={(e) => setFormData({ ...formData, estimatedBudget: parseFloat(e.target.value) || undefined })} className="w-full" />
          </div>

          <div>
            <label htmlFor="startedAt" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input id="startedAt" type="date" value={formData.startedAt || ''} onChange={(e) => setFormData({ ...formData, startedAt: e.target.value || undefined })} className="w-full" />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" value={formData.status || 'DRAFT'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full">
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Job'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
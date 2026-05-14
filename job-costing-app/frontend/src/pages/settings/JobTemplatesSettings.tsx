import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs.service';

export function JobTemplatesSettings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', estimatedBudget: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '', estimatedBudget: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: jobsService.getTemplates,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates'] });

  const createMutation = useMutation({
    mutationFn: () => jobsService.createTemplate({
      name: form.name,
      description: form.description || undefined,
      estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
    }),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ name: '', description: '', estimatedBudget: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: () => jobsService.updateTemplate(editingId!, {
      name: editForm.name,
      description: editForm.description || undefined,
      estimatedBudget: editForm.estimatedBudget ? parseFloat(editForm.estimatedBudget) : undefined,
    }),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsService.deleteTemplate(id),
    onSuccess: () => { invalidate(); setDeleteConfirm(null); },
  });

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, description: t.description || '', estimatedBudget: t.estimatedBudget?.toString() || '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Job Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Templates let you quickly pre-fill a new job's name, description and budget. They appear in the Create Job form.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Template</button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card border-2 border-dashed border-primary-200 bg-primary-50/30">
          <h3 className="text-sm font-medium text-gray-700 mb-4">New Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Office Fit-Out" className="w-full" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-20" placeholder="What does this job typically involve?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Estimated Budget ($)</label>
              <input type="number" min="0" step="1000" value={form.estimatedBudget} onChange={e => setForm({ ...form, estimatedBudget: e.target.value })} placeholder="e.g. 50000" className="w-full" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => createMutation.mutate()} disabled={!form.name.trim() || createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Saving…' : 'Add Template'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">No templates yet. Add one to speed up job creation.</div>
      ) : (
        <div className="space-y-3">
          {templates.map((t: any) => (
            <div key={t.id} className="card group">
              {editingId === t.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full" autoFocus />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full h-20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Budget ($)</label>
                    <input type="number" min="0" value={editForm.estimatedBudget} onChange={e => setEditForm({ ...editForm, estimatedBudget: e.target.value })} className="w-full" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => updateMutation.mutate()} disabled={!editForm.name.trim() || updateMutation.isPending} className="btn-primary text-sm">
                      {updateMutation.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    {t.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>}
                    {t.estimatedBudget && (
                      <p className="text-sm text-gray-400 mt-1">Default budget: ${Number(t.estimatedBudget).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => startEdit(t)} className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                    {deleteConfirm === t.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button onClick={() => deleteMutation.mutate(t.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(t.id)} className="text-sm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

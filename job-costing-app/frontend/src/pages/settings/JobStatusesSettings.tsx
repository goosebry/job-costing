import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobStatusesService, JobStatus } from '../../services/job-statuses.service';

const PRESET_COLORS = [
  '#6b7280', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#ef4444', '#14b8a6',
  '#f97316', '#06b6d4', '#84cc16', '#a855f7',
];

export function JobStatusesSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<{ label: string; color: string }>({ label: '', color: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['job-statuses'],
    queryFn: jobStatusesService.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['job-statuses'] });

  const createMutation = useMutation({
    mutationFn: jobStatusesService.create,
    onSuccess: () => { invalidate(); setShowAddForm(false); setNewLabel(''); setNewColor('#3b82f6'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobStatus> }) =>
      jobStatusesService.update(id, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: jobStatusesService.remove,
    onSuccess: () => { invalidate(); setDeleteConfirm(null); },
  });

  const startEdit = (s: JobStatus) => {
    setEditingId(s.id);
    setEditForm({ label: s.label, color: s.color });
  };

  const moveStatus = (id: string, direction: 'up' | 'down') => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx].order, sorted[swapIdx].order] = [sorted[swapIdx].order, sorted[idx].order];
    jobStatusesService.reorder(sorted).then(invalidate);
  };

  const sorted = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Job Statuses</h2>
          <p className="text-sm text-gray-500 mt-1">
            Customise the statuses available for jobs. Changes apply immediately across the app.
          </p>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            + Add Status
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card border-2 border-dashed border-primary-200 bg-primary-50/30">
          <h3 className="text-sm font-medium text-gray-700 mb-4">New Status</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  placeholder="e.g. In Review"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && newLabel.trim() && createMutation.mutate({ label: newLabel.trim(), color: newColor })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Badge Preview</label>
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium border"
                  style={{ backgroundColor: `${newColor}22`, color: newColor, borderColor: `${newColor}44` }}
                >
                  {newLabel || 'Preview'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Colour</label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? '#1d4ed8' : 'transparent',
                      outline: newColor === c ? '2px solid #1d4ed8' : 'none',
                      outlineOffset: '2px',
                    }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  title="Custom colour"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => createMutation.mutate({ label: newLabel.trim(), color: newColor })}
                disabled={!newLabel.trim() || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Saving…' : 'Add Status'}
              </button>
              <button onClick={() => { setShowAddForm(false); setNewLabel(''); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading statuses…</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((status, idx) => (
            <div
              key={status.id}
              className="card p-4 flex items-center gap-4 group transition-shadow hover:shadow-md"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveStatus(status.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveStatus(status.id, 'down')}
                  disabled={idx === sorted.length - 1}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Badge preview */}
              <span
                className="px-3 py-1 rounded-full text-sm font-medium border min-w-[100px] text-center"
                style={{
                  backgroundColor: `${status.color}22`,
                  color: status.color,
                  borderColor: `${status.color}44`,
                }}
              >
                {status.label}
              </span>

              {editingId === status.id ? (
                /* Edit inline form */
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                      className="flex-1"
                      autoFocus
                    />
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium border"
                      style={{
                        backgroundColor: `${editForm.color}22`,
                        color: editForm.color,
                        borderColor: `${editForm.color}44`,
                      }}
                    >
                      {editForm.label || 'Preview'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color: c })}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: editForm.color === c ? '#1d4ed8' : 'transparent',
                          outline: editForm.color === c ? '2px solid #1d4ed8' : 'none',
                          outlineOffset: '2px',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: status.id, data: editForm })}
                      disabled={!editForm.label.trim() || updateMutation.isPending}
                      className="btn-primary text-sm"
                    >
                      {updateMutation.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-mono">{status.value}</p>
                  </div>
                  {/* Actions — visible on hover */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(status)}
                      className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    {deleteConfirm === status.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => deleteMutation.mutate(status.id)}
                          className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(status.id)}
                        className="text-sm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Note: Renaming a status does not update existing jobs already using the old status value.
      </p>
    </div>
  );
}

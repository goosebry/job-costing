import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/clients.service';
import { jobsService } from '../services/jobs.service';
import { useJobStatuses } from '../hooks/useJobStatuses';
import api from '../services/api';

type CreateMode = null | 'template' | 'copy' | 'new';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getBadgeStyle, getLabel } = useJobStatuses();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);

  // Shared form fields used across modals
  const [jobName, setJobName] = useState('');
  const [jobStartDate, setJobStartDate] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobHours, setJobHours] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedSourceJob, setSelectedSourceJob] = useState<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.getOne(id!),
    enabled: !!id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['job-templates'],
    queryFn: () => api.get('/jobs/templates').then(r => r.data),
    enabled: createMode === 'template',
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ['jobs-all'],
    queryFn: () => api.get('/jobs').then(r => r.data),
    enabled: createMode === 'copy',
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => clientsService.update(id!, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client', id] }); setIsEditing(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsService.remove(id!),
    onSuccess: () => navigate('/clients'),
  });

  // Create a blank job bound to this client
  const createJobMutation = useMutation({
    mutationFn: (data: any) => api.post('/jobs', data).then(r => r.data),
    onSuccess: (newJob) => { queryClient.invalidateQueries({ queryKey: ['client', id] }); navigate(`/jobs/${newJob.id}`); },
  });

  // Copy an existing job, binding it to this client
  const copyJobMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: any }) =>
      jobsService.copyJob(jobId, { ...data, clientId: id }),
    onSuccess: (newJob) => { queryClient.invalidateQueries({ queryKey: ['client', id] }); navigate(`/jobs/${newJob.id}`); },
  });

  const openMode = (mode: CreateMode) => {
    setShowDropdown(false);
    setCreateMode(mode);
    setJobName('');
    setJobStartDate('');
    setJobBudget('');
    setJobHours('');
    setSelectedTemplate(null);
    setSelectedSourceJob(null);
  };

  const closeModal = () => setCreateMode(null);

  const handleCreate = () => {
    if (createMode === 'new') {
      createJobMutation.mutate({
        name: jobName.trim(),
        clientId: id,
        status: 'DRAFT',
        startedAt: jobStartDate || undefined,
        estimatedBudget: jobBudget ? Number(jobBudget) : undefined,
        estimatedHours: jobHours ? Number(jobHours) : undefined,
      });
    } else if (createMode === 'template' && selectedTemplate) {
      createJobMutation.mutate({
        name: jobName.trim() || selectedTemplate.name,
        clientId: id,
        templateId: selectedTemplate.id,
        status: 'DRAFT',
        startedAt: jobStartDate || undefined,
        estimatedBudget: jobBudget ? Number(jobBudget) : selectedTemplate.estimatedBudget,
        estimatedHours: jobHours ? Number(jobHours) : selectedTemplate.estimatedHours,
      });
    } else if (createMode === 'copy' && selectedSourceJob) {
      copyJobMutation.mutate({
        jobId: selectedSourceJob.id,
        data: { name: jobName.trim(), startedAt: jobStartDate || undefined, estimatedHours: jobHours ? Number(jobHours) : undefined },
      });
    }
  };

  const isBusy = createJobMutation.isPending || copyJobMutation.isPending;

  const canSubmit = () => {
    if (!jobName.trim()) return false;
    if (createMode === 'template' && !selectedTemplate) return false;
    if (createMode === 'copy' && !selectedSourceJob) return false;
    return true;
  };

  const startEdit = () => {
    setEditForm({
      name: client.name, contactName: client.contactName, email: client.email,
      phone: client.phone, address: client.address, notes: client.notes,
    });
    setIsEditing(true);
  };

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (error || !client) return <div className="text-center py-12 text-red-500">Client not found</div>;

  const modalTitle: Record<string, string> = {
    new: '+ New Job',
    template: 'Create from Template',
    copy: 'Copy Existing Job',
  };

  const modalDesc: Record<string, string> = {
    new: 'Create a blank job bound to this client.',
    template: 'Start from a standard template — pre-filled name, description, and budget.',
    copy: 'Copy any existing job with new dates, bound to this client.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="text-sm text-gray-500 hover:text-gray-700">← Clients</button>
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-bold text-lg">{client.name[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            {client.contactName && <p className="text-gray-500">{client.contactName}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={startEdit} className="btn-secondary">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <div className="card border-2 border-primary-200 bg-primary-50/20">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Edit Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input value={editForm.contactName || ''} onChange={e => setEditForm({ ...editForm, contactName: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full h-20" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.name?.trim() || updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact card */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Info</h2>
          {client.email && (
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline text-sm">{client.email}</a>
            </div>
          )}
          {client.phone && (
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <a href={`tel:${client.phone}`} className="text-sm">{client.phone}</a>
            </div>
          )}
          {client.address && (
            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm">{client.address}</p>
            </div>
          )}
          {client.notes && (
            <div>
              <p className="text-xs text-gray-400">Notes</p>
              <p className="text-sm text-gray-600 italic">{client.notes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Client since</p>
            <p className="text-sm">{new Date(client.createdAt).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Jobs <span className="text-gray-400 font-normal text-sm">({client.jobs?.length ?? 0})</span>
            </h2>

            {/* Split create button */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex rounded-xl overflow-hidden shadow-sm border border-primary-600">
                <button
                  onClick={() => openMode('new')}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  + New Job
                </button>
                <button
                  onClick={() => setShowDropdown(p => !p)}
                  className="px-2 py-2 bg-primary-600 text-white border-l border-primary-500 hover:bg-primary-700 transition-colors"
                  aria-label="More job creation options"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 10.5l-5-5h10l-5 5z" />
                  </svg>
                </button>
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => openMode('new')}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                    >
                      <span className="text-xl mt-0.5">📋</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">New Job</p>
                        <p className="text-xs text-gray-400">Blank job bound to this client</p>
                      </div>
                    </button>
                    <button
                      onClick={() => openMode('template')}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 text-left transition-colors group"
                    >
                      <span className="text-xl mt-0.5">🏗️</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">From Template</p>
                        <p className="text-xs text-gray-400">Use a pre-configured job template</p>
                      </div>
                    </button>
                    <button
                      onClick={() => openMode('copy')}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-left transition-colors group"
                    >
                      <span className="text-xl mt-0.5">📄</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">Copy Existing Job</p>
                        <p className="text-xs text-gray-400">Duplicate any job with new dates</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!client.jobs || client.jobs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-gray-500 font-medium mb-1">No jobs yet</p>
              <p className="text-sm text-gray-400 mb-4">Create a job, use a template, or copy an existing one.</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => openMode('new')} className="btn-primary text-sm">+ New Job</button>
                <button onClick={() => openMode('template')} className="btn-secondary text-sm">From Template</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {client.jobs.map((job: any) => (
                <div key={job.id} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">{job.jobNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={getBadgeStyle(job.status)}>
                        {getLabel(job.status)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{job.name}</p>
                    <p className="text-sm text-gray-500">${(job.estimatedBudget || 0).toLocaleString()} budget</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedSourceJob(job);
                        setJobName(`${job.name} (Copy)`);
                        setJobStartDate('');
                        setCreateMode('copy');
                      }}
                      className="text-xs text-gray-500 hover:text-purple-600 px-2 py-1 rounded hover:bg-purple-50 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Copy
                    </button>
                    <Link to={`/jobs/${job.id}`} className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50 border border-primary-200">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Job Creation Modal ── */}
      {createMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{modalTitle[createMode]}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{modalDesc[createMode]}</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* TEMPLATE PICKER */}
              {createMode === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Template</label>
                  {(templates as any[]).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No templates found. Create one in Settings → Job Templates.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {(templates as any[]).map((t: any) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(t);
                            if (!jobName) setJobName(t.name);
                            if (!jobBudget && t.estimatedBudget) setJobBudget(String(t.estimatedBudget));
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            selectedTemplate?.id === t.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                              {t.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>}
                            </div>
                            {t.estimatedBudget > 0 && (
                              <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                                ${t.estimatedBudget.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* COPY SOURCE PICKER */}
              {createMode === 'copy' && !selectedSourceJob && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Job to Copy</label>
                  {(allJobs as any[]).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No jobs available to copy.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {(allJobs as any[]).map((j: any) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            setSelectedSourceJob(j);
                            setJobName(`${j.name} (Copy)`);
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-gray-400 w-20 shrink-0">{j.jobNumber}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{j.name}</p>
                              {j.clientName && <p className="text-xs text-gray-400">{j.clientName}</p>}
                            </div>
                            <span className="ml-auto text-xs text-gray-400 shrink-0">${(j.estimatedBudget || 0).toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected source job chip */}
              {createMode === 'copy' && selectedSourceJob && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-purple-600 text-sm">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Copying: {selectedSourceJob.name}</p>
                    <p className="text-xs text-gray-400">{selectedSourceJob.jobNumber} · ${(selectedSourceJob.estimatedBudget || 0).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedSourceJob(null); setJobName(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Selected template chip */}
              {createMode === 'template' && selectedTemplate && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-blue-600 text-sm">🏗️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Template: {selectedTemplate.name}</p>
                    <p className="text-xs text-gray-400">{selectedTemplate.description?.substring(0, 60)}{selectedTemplate.description?.length > 60 ? '…' : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedTemplate(null); setJobName(''); setJobBudget(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Job name — always shown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Name *</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  placeholder={createMode === 'template' ? 'Will use template name if blank' : 'e.g. Office Renovation 2025'}
                  className="input w-full"
                  autoFocus={createMode === 'new'}
                />
              </div>

              {/* Budget — shown for new/template */}
              {createMode !== 'copy' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Budget (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      min={0}
                      value={jobBudget}
                      onChange={e => setJobBudget(e.target.value)}
                      placeholder="0"
                      className="input w-full pl-7"
                    />
                  </div>
                </div>
              )}

              {/* Estimated Hours — shown for new/template; copy shows it only if not already set */}
              {createMode !== 'copy' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Time (optional)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={jobHours}
                      onChange={e => setJobHours(e.target.value)}
                      placeholder="e.g. 8"
                      className="input w-full pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">hrs</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used to track labour progress against plan</p>
                </div>
              )}

              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date (optional)</label>
                <input
                  type="date"
                  value={jobStartDate}
                  onChange={e => setJobStartDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Client binding note */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                <span>🏢</span>
                <span>Will be bound to <strong className="text-gray-700">{client.name}</strong></span>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!canSubmit() || isBusy}
                className="btn-primary flex-1"
              >
                {isBusy ? 'Creating…' : createMode === 'copy' ? 'Create Copy' : createMode === 'template' ? 'Create from Template' : 'Create Job'}
              </button>
              <button onClick={closeModal} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete {client.name}?</h2>
            <p className="text-sm text-gray-500 mb-6">This removes the client record. Existing jobs will become unbound but won't be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-danger flex-1">
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

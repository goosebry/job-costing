import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService, CreateClientRequest } from '../services/clients.service';

export function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateClientRequest>({ name: '', contactName: '', email: '', phone: '', address: '', notes: '' });
  const [formError, setFormError] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsService.getAll(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: clientsService.create,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setForm({ name: '', contactName: '', email: '', phone: '', address: '', notes: '' });
      navigate(`/clients/${client.id}`);
    },
    onError: () => setFormError('Failed to create client'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Client</button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card border-2 border-primary-200 bg-primary-50/20">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New Client</h2>
          {formError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Corp" className="w-full" autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input value={form.contactName || ''} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="e.g. Jane Smith" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@acme.com" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="09 123 4567" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Auckland" className="w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full h-20" placeholder="e.g. Net 30 terms, requires PO number…" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate(form)} disabled={!form.name.trim() || createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving…' : 'Create Client'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <input
          type="text"
          placeholder="Search clients by name or contact…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4"
        />

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {search ? 'No clients match your search.' : 'No clients yet. Create your first one.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map(client => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md cursor-pointer transition-all group"
              >
                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold text-sm">{client.name[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-primary-700 truncate">{client.name}</p>
                    {client.contactName && <p className="text-sm text-gray-500 truncate">{client.contactName}</p>}
                  </div>
                </div>
                {/* Contact details */}
                <div className="space-y-1 text-sm text-gray-600">
                  {client.email && <p className="truncate">✉ {client.email}</p>}
                  {client.phone && <p>📞 {client.phone}</p>}
                  {client.address && <p className="truncate">📍 {client.address}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

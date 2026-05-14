'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jobsApi, costsApi } from '@/services/api';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'DRAFT',
    templateId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Load job templates
    // templatesApi.list().then(res => setTemplates(res.data.data || []));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await jobsApi.create({
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      });
      router.push('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create New Job</h1>
        <p className="page-subtitle">Fill in the details to create a new job</p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">Job Name *</label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-input" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="customerName" className="form-label">Customer Name</label>
              <input id="customerName" name="customerName" type="text" value={formData.customerName} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="customerContact" className="form-label">Contact Person</label>
              <input id="customerContact" name="customerContact" type="text" value={formData.customerContact} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="customerEmail" className="form-label">Customer Email</label>
              <input id="customerEmail" name="customerEmail" type="email" value={formData.customerEmail} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone" className="form-label">Customer Phone</label>
              <input id="customerPhone" name="customerPhone" type="tel" value={formData.customerPhone} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">Start Date *</label>
              <input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="form-input">
              <option value="DRAFT">Draft</option>
              <option value="PROPOSED">Proposed</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Job'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
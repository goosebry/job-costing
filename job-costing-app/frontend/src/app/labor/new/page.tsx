'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { laborApi } from '@/services/api';
import { useState } from 'react';

export default function CreateLaborPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobId: jobId || '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    hoursTravel: '0',
    hourlyRate: '',
    lumpSum: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (parseFloat(formData.hoursWorked) <= 0) {
      setError('Hours worked must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      await laborApi.create({
        jobId: formData.jobId,
        date: new Date(formData.date).toISOString(),
        hoursWorked: parseFloat(formData.hoursWorked),
        hoursTravel: parseFloat(formData.hoursTravel) || 0,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        lumpSum: formData.lumpSum ? parseFloat(formData.lumpSum) : undefined,
        notes: formData.notes,
      });
      router.push(jobId ? `/jobs/${jobId}` : '/labor');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create labor entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Log Labor</h1>
        <p className="page-subtitle">Submit timesheet for approval</p>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {!jobId && (
            <div className="form-group">
              <label htmlFor="jobId" className="form-label">Job *</label>
              <input id="jobId" name="jobId" type="text" value={formData.jobId} onChange={handleChange} className="form-input" required />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="date" className="form-label">Date *</label>
            <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="form-input" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="hoursWorked" className="form-label">Hours Worked *</label>
              <input id="hoursWorked" name="hoursWorked" type="number" step="0.25" min="0" max="24" value={formData.hoursWorked} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label htmlFor="hoursTravel" className="form-label">Hours Travel</label>
              <input id="hoursTravel" name="hoursTravel" type="number" step="0.25" min="0" max="24" value={formData.hoursTravel} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="hourlyRate" className="form-label">Hourly Rate</label>
              <input id="hourlyRate" name="hourlyRate" type="number" step="0.01" min="0" value={formData.hourlyRate} onChange={handleChange} className="form-input" placeholder="Leave blank if using lump sum" />
            </div>
            <div className="form-group">
              <label htmlFor="lumpSum" className="form-label">Lump Sum</label>
              <input id="lumpSum" name="lumpSum" type="number" step="0.01" min="0" value={formData.lumpSum} onChange={handleChange} className="form-input" placeholder="Leave blank if using hourly rate" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="form-input" rows={3} placeholder="Add any additional notes" />
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Submitting...' : 'Submit Timesheet'}</button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
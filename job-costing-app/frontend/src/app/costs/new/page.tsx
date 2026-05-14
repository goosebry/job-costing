'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jobsApi, costsApi } from '@/services/api';

export default function CreateCostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [costCodes, setCostCodes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    jobId: jobId || '',
    categoryId: '',
    costCodeId: '',
    description: '',
    amount: '',
    vendor: '',
    invoiceNumber: '',
    invoiceDate: '',
    receiptUrl: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, codeRes] = await Promise.all([
          costsApi.getCategories(),
          costsApi.getCostCodes(),
        ]);
        setCategories(catRes.data.data || []);
        setCostCodes(codeRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await costsApi.create({
        ...formData,
        amount: parseFloat(formData.amount),
        invoiceDate: formData.invoiceDate || undefined,
      });
      router.push(jobId ? `/jobs/${jobId}` : '/costs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cost entry');
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = costCodes.filter((c) => c.categoryId === formData.categoryId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Add Cost Entry</h1>
        <p className="page-subtitle">Record material, subcontract, or equipment costs</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="categoryId" className="form-label">Category *</label>
              <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="form-input" required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="costCodeId" className="form-label">Cost Code</label>
              <select id="costCodeId" name="costCodeId" value={formData.costCodeId} onChange={handleChange} className="form-input" disabled={!formData.categoryId}>
                <option value="">Select cost code</option>
                {filteredCodes.map((code) => (
                  <option key={code.id} value={code.id}>{code.code} - {code.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">Amount *</label>
            <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-input" rows={2} />
          </div>

          <div className="form-group">
            <label htmlFor="vendor" className="form-label">Vendor</label>
            <input id="vendor" name="vendor" type="text" value={formData.vendor} onChange={handleChange} className="form-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="invoiceNumber" className="form-label">Invoice Number</label>
              <input id="invoiceNumber" name="invoiceNumber" type="text" value={formData.invoiceNumber} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="invoiceDate" className="form-label">Invoice Date</label>
              <input id="invoiceDate" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Cost'}</button>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
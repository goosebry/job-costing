'use client';

import { useEffect, useState } from 'react';
import { costsApi } from '@/services/api';

export default function CostsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await costsApi.list({ page, limit: 20 });
        setEntries(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch costs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCosts();
  }, [page]);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Cost Entries</h1>
          <p className="page-subtitle">Track material, subcontract, and equipment costs</p>
        </div>
        <a href="/costs/new" className="btn btn-primary">Add Cost Entry</a>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cost entries found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Job</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td>{entry.job?.name || '-'}</td>
                  <td>{entry.category?.name || '-'}</td>
                  <td>{entry.description || '-'}</td>
                  <td className="font-medium">${Number(entry.amount).toLocaleString()}</td>
                  <td>{entry.vendor || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {page > 1 && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setPage(p => p - 1)} className="btn btn-secondary">Previous</button>
          <button onClick={() => setPage(p => p + 1)} className="btn btn-secondary ml-2">Next</button>
        </div>
      )}
    </div>
  );
}
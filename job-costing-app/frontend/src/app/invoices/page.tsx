'use client';

import { useEffect, useState } from 'react';
import { invoicesApi } from '@/services/api';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  DRAFT: 'badge-neutral',
  SENT: 'badge-info',
  PAID: 'badge-success',
  VOID: 'badge-danger',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await invoicesApi.list({ page, limit: 20, status: status || undefined });
        setInvoices(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [page, status]);

  const handleSend = async (id: string) => {
    try {
      await invoicesApi.send(id);
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'SENT' } : inv));
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage invoices and payments</p>
        </div>
        <a href="/invoices/new" className="btn btn-primary">Create Invoice</a>
      </div>

      <div className="card mb-6">
        <div className="card-body flex gap-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input w-48">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center"><div className="spinner mx-auto" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Job</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium">{invoice.invoiceNumber}</td>
                  <td>{invoice.job?.name || '-'}</td>
                  <td className="font-medium">${Number(invoice.amount).toLocaleString()}</td>
                  <td><span className={`badge ${statusColors[invoice.status]}`}>{invoice.status}</span></td>
                  <td>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}</td>
                  <td>
                    {invoice.status === 'DRAFT' && (
                      <button onClick={() => handleSend(invoice.id)} className="btn btn-sm btn-primary">Send</button>
                    )}
                    {invoice.status === 'SENT' && (
                      <span className="text-sm text-gray-500">Awaiting payment</span>
                    )}
                    {invoice.status === 'PAID' && (
                      <span className="text-sm text-green-600">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
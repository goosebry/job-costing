import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface InvoiceViewModalProps {
  invoiceId: string;
  onClose: () => void;
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function statusColor(status: string) {
  if (status === 'PAID') return '#16a34a';
  if (status === 'OVERDUE') return '#dc2626';
  return '#d97706';
}

/** Builds the full invoice HTML string for print/PDF */
function buildPrintHtml(inv: any): string {
  const lineRows = (inv.lineItems || []).map((item: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#374151">${item.description}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;text-align:center">${item.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right">${fmt(item.unitPrice)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:600">${fmt(item.total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${inv.number || inv.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; padding: 48px; }
    @media print { body { padding: 32px; } }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .company-name { font-size: 24px; font-weight: 700; color: #1e40af; }
    .company-sub { font-size: 12px; color: #6b7280; margin-top: 4px; line-height: 1.6; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
    .invoice-title .number { font-size: 15px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px; color: ${statusColor(inv.status)}; border: 1.5px solid ${statusColor(inv.status)}; }
    .meta { display: flex; gap: 48px; margin-bottom: 36px; }
    .meta-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 4px; }
    .meta-block p { font-size: 13px; color: #374151; line-height: 1.5; }
    .meta-block p strong { color: #111827; }
    .divider { border: none; border-top: 2px solid #e5e7eb; margin: 28px 0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 2px solid #1e3a8a; }
    thead th { padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; text-align: left; }
    thead th:last-child, thead th:nth-child(3) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table tr td { padding: 5px 0; font-size: 13px; color: #374151; }
    .totals-table tr td:last-child { text-align: right; font-weight: 600; }
    .totals-table tr.total-row td { font-size: 16px; font-weight: 800; color: #111827; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 8px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    .notes-box { margin-top: 28px; padding: 14px 16px; background: #f9fafb; border-left: 3px solid #1e40af; border-radius: 4px; font-size: 12px; color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${inv.company?.name || 'Your Company'}</div>
      <div class="company-sub">
        ${inv.company?.address || ''}<br>
        ${inv.company?.phone || ''} &nbsp;|&nbsp; ${inv.company?.email || ''}<br>
        ${inv.company?.gstNumber || ''}
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="number">${inv.number || inv.invoiceNumber}</div>
      <div class="status-badge">${inv.status}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Bill To</h4>
      <p><strong>${inv.client?.name || 'Client'}</strong></p>
      ${inv.client?.contactName ? `<p>${inv.client.contactName}</p>` : ''}
      ${inv.client?.email ? `<p>${inv.client.email}</p>` : ''}
      ${inv.client?.phone ? `<p>${inv.client.phone}</p>` : ''}
      ${inv.client?.address ? `<p>${inv.client.address}</p>` : ''}
    </div>
    <div class="meta-block">
      <h4>Job Reference</h4>
      <p><strong>${inv.job?.jobNumber || '—'}</strong></p>
      <p>${inv.job?.name || ''}</p>
    </div>
    <div class="meta-block">
      <h4>Invoice Date</h4>
      <p>${fmtDate(inv.issueDate)}</p>
      <h4 style="margin-top:10px">Due Date</h4>
      <p><strong style="color:${new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' ? '#dc2626' : '#111827'}">${fmtDate(inv.dueDate)}</strong></p>
    </div>
  </div>

  <hr class="divider" />

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center;width:60px">Qty</th>
        <th style="text-align:right;width:120px">Unit Price</th>
        <th style="text-align:right;width:120px">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal</td><td>${fmt(inv.subtotal || 0)}</td></tr>
      <tr><td>${inv.taxLabel || 'Tax'} (${Math.round((inv.taxRate || 0) * 100)}%)</td><td>${fmt(inv.tax || 0)}</td></tr>
      <tr class="total-row"><td>Total Due</td><td>${fmt(inv.total || 0)}</td></tr>
      ${inv.status === 'PAID' && inv.paidAt ? `<tr><td style="color:#16a34a">Paid</td><td style="color:#16a34a">${fmtDate(inv.paidAt)}</td></tr>` : ''}
    </table>
  </div>

  ${inv.paymentTerms || inv.notes ? `
  <div class="notes-box">
    ${inv.paymentTerms ? `<p><strong>Payment Terms:</strong> ${inv.paymentTerms}</p>` : ''}
    ${inv.notes ? `<p style="margin-top:4px">${inv.notes}</p>` : ''}
  </div>` : ''}

  <div class="footer">
    <span>${inv.company?.name || ''} &mdash; ${inv.company?.gstNumber || ''}</span>
    <span>Generated ${new Date().toLocaleDateString('en-NZ')}</span>
  </div>
</body>
</html>`;
}

export function InvoiceViewModal({ invoiceId, onClose }: InvoiceViewModalProps) {
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const { data: inv, isLoading, error } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => { const r = await api.get(`/invoices/${invoiceId}`); return r.data; },
    onSuccess: (data: any) => {
      if (data?.client?.email) setEmailTo(data.client.email);
    },
  } as any);

  const handlePrint = () => {
    if (!inv) return;
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    w.document.write(buildPrintHtml(inv));
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  const handleDownloadPdf = () => {
    if (!inv) return;
    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    w.document.write(buildPrintHtml(inv));
    w.document.close();
    w.focus();
    // Small delay ensures styles render before print dialog opens
    setTimeout(() => { w.print(); }, 400);
  };

  const handleSendEmail = () => {
    if (!inv) return;
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setShowEmailPanel(false); }, 2500);
  };

  const overdue = inv?.dueDate && new Date(inv.dueDate) < new Date() && inv?.status !== 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">

        {/* Action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              Invoice {inv?.number || inv?.invoiceNumber || '…'}
            </span>
            {inv?.status && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                inv.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-amber-100 text-amber-700 border-amber-200'
              }`}>{inv.status}</span>
            )}
            {overdue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                ⚠ Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              🖨 Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              ⬇ Download PDF
            </button>
            <button
              onClick={() => { setShowEmailPanel(p => !p); setEmailSent(false); }}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                showEmailPanel
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              ✉ Email
            </button>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Email compose panel */}
        {showEmailPanel && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            {emailSent ? (
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <span className="text-lg">✅</span> Email sent to {emailTo}
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Invoice ${inv?.number || inv?.invoiceNumber} — ${inv?.job?.name || 'Job'}`}
                    className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  />
                </div>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailTo}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  Send Invoice
                </button>
                <button onClick={() => setShowEmailPanel(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              The invoice PDF will be attached automatically when sent.
            </p>
          </div>
        )}

        {/* Invoice document */}
        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-16 text-gray-400 animate-pulse">Loading invoice…</div>
          ) : error ? (
            <div className="text-center py-16 text-red-400">Failed to load invoice</div>
          ) : inv ? (
            <div className="font-sans">
              {/* Header */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-2xl font-bold text-primary-700">{inv.company?.name}</h1>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {inv.company?.address}<br />
                    {inv.company?.phone} · {inv.company?.email}<br />
                    {inv.company?.gstNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-blue-900 tracking-tight">INVOICE</p>
                  <p className="text-base text-gray-500 mt-1">{inv.number || inv.invoiceNumber}</p>
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold border ${
                    inv.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                    overdue ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>{inv.status}</span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex gap-12 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">Bill To</p>
                  <p className="font-bold text-gray-900">{inv.client?.name || 'Client'}</p>
                  {inv.client?.contactName && <p className="text-sm text-gray-600">{inv.client.contactName}</p>}
                  {inv.client?.email && <p className="text-sm text-gray-600">{inv.client.email}</p>}
                  {inv.client?.phone && <p className="text-sm text-gray-600">{inv.client.phone}</p>}
                  {inv.client?.address && <p className="text-sm text-gray-600">{inv.client.address}</p>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">Job Reference</p>
                  <p className="font-bold text-gray-900">{inv.job?.jobNumber}</p>
                  <p className="text-sm text-gray-600">{inv.job?.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Invoice Date</p>
                    <p className="text-sm font-medium text-gray-900">{fmtDate(inv.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Due Date</p>
                    <p className={`text-sm font-bold ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {fmtDate(inv.dueDate)}
                      {overdue && <span className="ml-1 text-xs font-normal">⚠ Overdue</span>}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Line items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-blue-900">
                    <th className="text-left pb-2 text-xs uppercase tracking-wide text-blue-900">Description</th>
                    <th className="text-center pb-2 text-xs uppercase tracking-wide text-blue-900 w-16">Qty</th>
                    <th className="text-right pb-2 text-xs uppercase tracking-wide text-blue-900 w-32">Unit Price</th>
                    <th className="text-right pb-2 text-xs uppercase tracking-wide text-blue-900 w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(inv.lineItems || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-800">{item.description}</td>
                      <td className="py-3 text-center text-gray-500">{item.qty}</td>
                      <td className="py-3 text-right text-gray-700">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-72">
                  <div className="flex justify-between text-sm py-1.5 text-gray-600">
                    <span>Subtotal</span><span className="font-medium text-gray-900">{fmt(inv.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1.5 text-gray-600">
                    <span>{inv.taxLabel || 'Tax'} ({Math.round((inv.taxRate || 0) * 100)}%)</span>
                    <span className="font-medium text-gray-900">{fmt(inv.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold py-3 border-t-2 border-gray-200 mt-1 text-gray-900">
                    <span>Total Due</span><span className="text-lg">{fmt(inv.total || 0)}</span>
                  </div>
                  {inv.status === 'PAID' && inv.paidAt && (
                    <div className="flex justify-between text-sm py-1 text-green-700 font-medium">
                      <span>✓ Paid</span><span>{fmtDate(inv.paidAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {(inv.paymentTerms || inv.notes) && (
                <div className="mt-8 p-4 bg-gray-50 rounded-xl border-l-4 border-primary-500">
                  {inv.paymentTerms && (
                    <p className="text-xs text-gray-600"><strong>Payment Terms:</strong> {inv.paymentTerms}</p>
                  )}
                  {inv.notes && (
                    <p className="text-xs text-gray-500 mt-1">{inv.notes}</p>
                  )}
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>{inv.company?.name} — {inv.company?.gstNumber}</span>
                <span>Generated {new Date().toLocaleDateString('en-NZ')}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

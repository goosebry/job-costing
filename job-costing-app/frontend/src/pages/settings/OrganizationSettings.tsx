import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// Country tax presets — covers the most common regions for construction businesses
const TAX_PRESETS: Record<string, { label: string; rate: number; taxLabel: string; currency: string }> = {
  NZ:  { label: 'New Zealand',      rate: 0.15,  taxLabel: 'GST',        currency: 'NZD' },
  AU:  { label: 'Australia',        rate: 0.10,  taxLabel: 'GST',        currency: 'AUD' },
  GB:  { label: 'United Kingdom',   rate: 0.20,  taxLabel: 'VAT',        currency: 'GBP' },
  US:  { label: 'United States',    rate: 0,     taxLabel: 'Sales Tax',  currency: 'USD' },
  CA:  { label: 'Canada (federal)', rate: 0.05,  taxLabel: 'GST',        currency: 'CAD' },
  CA_ON: { label: 'Canada (Ontario HST)', rate: 0.13, taxLabel: 'HST',   currency: 'CAD' },
  CA_BC: { label: 'Canada (BC HST)', rate: 0.12, taxLabel: 'HST',        currency: 'CAD' },
  SG:  { label: 'Singapore',        rate: 0.09,  taxLabel: 'GST',        currency: 'SGD' },
  ZA:  { label: 'South Africa',     rate: 0.15,  taxLabel: 'VAT',        currency: 'ZAR' },
  EU_DE: { label: 'Germany (VAT)',  rate: 0.19,  taxLabel: 'VAT (MwSt)', currency: 'EUR' },
  EU_FR: { label: 'France (TVA)',   rate: 0.20,  taxLabel: 'TVA',        currency: 'EUR' },
  EU_IE: { label: 'Ireland (VAT)',  rate: 0.23,  taxLabel: 'VAT',        currency: 'EUR' },
  NONE: { label: 'No tax / custom', rate: 0,     taxLabel: '',           currency: '' },
};

function fetchOrgSettings() {
  return api.get('/organization/settings').then(r => r.data);
}

export function OrganizationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: fetchOrgSettings,
  });

  const [form, setForm] = useState({
    name: '',
    country: 'NZ',
    currency: 'NZD',
    taxLabel: 'GST',
    taxRate: 15,
    taxEnabled: true,
    invoicePrefix: 'INV',
    paymentTermsDays: 30,
    trackInvoicePayments: false,
  });
  const [saved, setSaved] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('NZ');

  // Initialise form from API data
  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        country: settings.country || 'NZ',
        currency: settings.currency || 'NZD',
        taxLabel: settings.taxLabel || 'GST',
        taxRate: Math.round((settings.taxRate || 0) * 1000) / 10,
        taxEnabled: settings.taxEnabled !== false,
        invoicePrefix: settings.invoicePrefix || 'INV',
        paymentTermsDays: settings.paymentTermsDays || 30,
        trackInvoicePayments: settings.trackInvoicePayments ?? false,
      });
      // Try to match to a preset
      const match = Object.entries(TAX_PRESETS).find(
        ([, p]) => p.rate === (settings.taxRate || 0) && p.taxLabel === settings.taxLabel
      );
      setSelectedPreset(match ? match[0] : 'CUSTOM');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.patch('/organization/settings', {
        ...data,
        taxRate: data.taxRate / 100, // 15 → 0.15 for the backend
      }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const applyPreset = (key: string) => {
    setSelectedPreset(key);
    const preset = TAX_PRESETS[key];
    if (!preset) return;
    setForm(f => ({
      ...f,
      country: key.split('_')[0],
      taxLabel: preset.taxLabel,
      taxRate: Math.round(preset.rate * 1000) / 10,
      taxEnabled: preset.rate > 0,
      ...(preset.currency ? { currency: preset.currency } : {}),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return <div className="card p-6 text-gray-400 animate-pulse">Loading settings…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Organisation Details */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-sm">🏢</span>
          Organisation Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Prefix</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))}
              placeholder="INV"
              className="input w-full font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">e.g. INV → INV-001</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms (days)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={form.paymentTermsDays}
              onChange={e => setForm(f => ({ ...f, paymentTermsDays: Number(e.target.value) }))}
              className="input w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Added to issue date on new invoices</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Role</label>
            <p className="mt-1 text-sm font-medium text-gray-900 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Tax Settings */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">%</span>
          Tax Settings
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Select your country or region to pre-fill the standard rate, then adjust as needed. The rate you set here is applied to all invoices.
        </p>

        {/* Country / region presets */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Country / Region Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TAX_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  selectedPreset === key
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                <div className="font-medium truncate">{preset.label}</div>
                <div className={`text-xs mt-0.5 ${selectedPreset === key ? 'text-primary-200' : 'text-gray-400'}`}>
                  {preset.taxLabel}{preset.rate > 0 ? ` · ${Math.round(preset.rate * 1000) / 10}%` : preset.rate === 0 && preset.taxLabel ? ' · 0%' : ' · custom'}
                </div>
              </button>
            ))}
            {selectedPreset === 'CUSTOM' && (
              <button type="button" className="text-left px-3 py-2.5 rounded-xl border bg-primary-600 text-white border-primary-600 shadow-sm text-sm">
                <div className="font-medium">Custom</div>
                <div className="text-xs mt-0.5 text-primary-200">Manual entry</div>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Selecting a preset fills the fields below. You can always override them.
          </p>
        </div>

        {/* Tax fields */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Label</label>
            <input
              type="text"
              value={form.taxLabel}
              onChange={e => { setSelectedPreset('CUSTOM'); setForm(f => ({ ...f, taxLabel: e.target.value })); }}
              placeholder="GST / VAT / HST"
              className="input w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Shown on invoices</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rate (%)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.taxRate}
                onChange={e => { setSelectedPreset('CUSTOM'); setForm(f => ({ ...f, taxRate: Number(e.target.value) })); }}
                className="input w-full pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">e.g. 15 for 15%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input
              type="text"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
              placeholder="NZD"
              maxLength={3}
              className="input w-full font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">3-letter code (NZD, AUD…)</p>
          </div>
        </div>

        {/* Tax enabled toggle */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Apply tax to invoices</p>
            <p className="text-xs text-gray-400">Disable for tax-exempt or zero-rated organisations</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, taxEnabled: !f.taxEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.taxEnabled ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.taxEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Live preview */}
        {form.taxEnabled && form.taxRate > 0 && (
          <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Invoice preview</p>
            <div className="space-y-1 text-gray-700">
              <div className="flex justify-between"><span>Subtotal</span><span>$1,000.00</span></div>
              <div className="flex justify-between text-gray-500">
                <span>{form.taxLabel || 'Tax'} ({form.taxRate}%)</span>
                <span>${(10 * form.taxRate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1 text-gray-900">
                <span>Total Due</span>
                <span>${(1000 + 10 * form.taxRate).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Tracking */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">🧾</span>
          Invoice Payment Tracking
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Choose how invoice statuses work. This only affects your workflow inside Job Costing — your accounting software is the source of truth for payments.
        </p>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, trackInvoicePayments: false }))}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              !form.trackInvoicePayments
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📤</span>
              <p className={`text-sm font-bold ${!form.trackInvoicePayments ? 'text-primary-700' : 'text-gray-900'}`}>Simple (Recommended)</p>
              {!form.trackInvoicePayments && <span className="ml-auto text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Active</span>}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Invoices move through <strong>Created → Printed → Emailed</strong> automatically when you take those actions. No payment reconciliation needed here.</p>
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, trackInvoicePayments: true }))}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              form.trackInvoicePayments
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">💳</span>
              <p className={`text-sm font-bold ${form.trackInvoicePayments ? 'text-primary-700' : 'text-gray-900'}`}>Track Payments</p>
              {form.trackInvoicePayments && <span className="ml-auto text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Active</span>}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Adds <strong>Pending → Overdue → Paid</strong> statuses. You manually mark invoices as paid from the Invoices reconciliation table.</p>
          </button>
        </div>

        {form.trackInvoicePayments && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-0.5">⚠ Payment tracking enabled</p>
            <p className="text-xs text-amber-700">Invoices past their due date will be shown as <span className="font-bold">Overdue</span>. Go to <strong>Invoices</strong> in the sidebar to manually reconcile and mark them as Paid.</p>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">Changes are applied immediately to all new invoices.</p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              ✓ Saved
            </span>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </form>
  );
}
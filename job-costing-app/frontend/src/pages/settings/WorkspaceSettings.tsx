import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

type DataMode = 'demo' | 'live';
type ActionKey = 'go-live' | 'clear-data' | 'redo-setup';

interface Action {
  key: ActionKey;
  label: string;
  endpoint: string;
  icon: string;
  color: string;
  description: string;
  consequence: string;
  keeps: string;
  deletes: string;
  confirm: string;
  buttonLabel: string;
}

const ACTIONS: Action[] = [
  {
    key: 'go-live',
    label: 'Go Live',
    endpoint: '/onboarding/go-live',
    icon: '🚀',
    color: 'emerald',
    description: 'Switch from demo mode to live mode.',
    consequence: 'Removes all demo data — jobs, clients, costs, labour, invoices and change orders — so you can begin using the system with your real business data.',
    keeps: 'All job templates and cost categories created during setup.',
    deletes: 'All jobs, clients, costs, labour entries, invoices, and change orders.',
    confirm: 'This is irreversible. All demo data will be permanently deleted.',
    buttonLabel: 'Go Live',
  },
  {
    key: 'clear-data',
    label: 'Clear All Data',
    endpoint: '/onboarding/clear-data',
    icon: '🗑️',
    color: 'amber',
    description: 'Delete all transactional data and start with a completely clean workspace.',
    consequence: 'Removes everything — including any real data you may have added — while keeping your templates and categories intact.',
    keeps: 'All job templates and cost categories.',
    deletes: 'All jobs, clients, costs, labour entries, invoices, and change orders.',
    confirm: 'This is irreversible. All data will be permanently deleted.',
    buttonLabel: 'Clear All Data',
  },
  {
    key: 'redo-setup',
    label: 'Redo Setup Wizard',
    endpoint: '/onboarding/redo-setup',
    icon: '🔄',
    color: 'rose',
    description: 'Restart the AI setup wizard from the beginning.',
    consequence: 'Clears all data AND all templates/categories, then re-runs the onboarding wizard so you can set up your workspace from scratch.',
    keeps: 'Nothing — a completely fresh start.',
    deletes: 'All data, templates, and categories.',
    confirm: 'This is irreversible. Everything will be deleted and the setup wizard will restart.',
    buttonLabel: 'Redo Setup',
  },
];

function colorClasses(color: string) {
  const map: Record<string, { border: string; bg: string; text: string; badge: string; btn: string; ring: string }> = {
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'ring-emerald-400' },
    amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-600 hover:bg-amber-700',   ring: 'ring-amber-400'   },
    rose:    { border: 'border-rose-200',     bg: 'bg-rose-50',    text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-700',    btn: 'bg-rose-600 hover:bg-rose-700',    ring: 'ring-rose-400'    },
  };
  return map[color] ?? map.emerald;
}

export function WorkspaceSettings() {
  const queryClient = useQueryClient();
  const [dataMode, setDataMode] = useState<DataMode | null>(null);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/onboarding/status').then(r => setDataMode(r.data.mode ?? r.data.dataMode)).catch(() => setDataMode('demo'));
  }, []);

  function openModal(action: Action) {
    setActiveAction(action);
    setPassword('');
    setPasswordError('');
    setDone(null);
    setTimeout(() => passwordRef.current?.focus(), 100);
  }

  function closeModal() {
    setActiveAction(null);
    setPassword('');
    setPasswordError('');
    setDone(null);
    setLoading(false);
  }

  async function executeAction() {
    if (!activeAction) return;
    if (!password.trim()) {
      setPasswordError('Please enter your password to confirm.');
      return;
    }
    setLoading(true);
    setPasswordError('');
    try {
      const r = await api.post(activeAction.endpoint, { password });
      setDataMode(r.data.dataMode);
      setDone(activeAction.label);
      // Invalidate all queries so data refreshes
      queryClient.invalidateQueries();
      if (activeAction.key === 'redo-setup') {
        localStorage.removeItem('onboarding_complete');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError(e?.response?.data?.error || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const c = activeAction ? colorClasses(activeAction.color) : colorClasses('emerald');

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header + Mode badge */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Workspace & Data</h2>
          {dataMode && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              dataMode === 'demo'
                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {dataMode === 'demo' ? '🧪 Demo Mode' : '🚀 Live Mode'}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          Manage your workspace data. These actions are <strong>permanent and irreversible</strong> — your password is required to proceed.
        </p>
      </div>

      {/* Action cards */}
      <div className="space-y-4">
        {ACTIONS.map(action => {
          const cc = colorClasses(action.color);
          return (
            <div key={action.key} className={`rounded-xl border ${cc.border} ${cc.bg} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{action.icon}</span>
                  <div>
                    <h3 className={`font-semibold ${cc.text} text-base`}>{action.label}</h3>
                    <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <p>✅ <strong>Keeps:</strong> {action.keeps}</p>
                      <p>❌ <strong>Deletes:</strong> {action.deletes}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openModal(action)}
                  className={`shrink-0 px-4 py-2 ${cc.btn} text-white text-sm font-semibold rounded-lg transition-colors shadow-sm`}
                >
                  {action.buttonLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Password Confirmation Modal */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {done ? (
              // Success state
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Done!</h3>
                <p className="text-gray-500 text-sm">
                  {activeAction.key === 'redo-setup'
                    ? 'Reloading to start setup wizard…'
                    : `${done} completed successfully.`}
                </p>
                {activeAction.key !== 'redo-setup' && (
                  <button onClick={closeModal} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    Close
                  </button>
                )}
              </div>
            ) : (
              // Confirm state
              <>
                <div className={`px-6 pt-6 pb-4 border-b border-gray-100`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{activeAction.icon}</span>
                    <h3 className="text-lg font-bold text-gray-900">{activeAction.label}</h3>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-sm text-amber-800">
                    <span className="text-lg leading-none">⚠️</span>
                    <p>{activeAction.confirm}</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>✅ <strong>Keeps:</strong> {activeAction.keeps}</p>
                    <p>❌ <strong>Deletes:</strong> {activeAction.deletes}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Enter your password to confirm
                    </label>
                    <input
                      ref={passwordRef}
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                      onKeyDown={e => e.key === 'Enter' && executeAction()}
                      placeholder="Your account password"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                        passwordError ? `border-red-300 focus:ring-red-300` : `border-gray-300 focus:ring-${activeAction.color}-400`
                      }`}
                    />
                    {passwordError && (
                      <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> {passwordError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={loading || !password.trim()}
                    className={`px-5 py-2.5 ${c.btn} disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2`}
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                    ) : (
                      `Confirm — ${activeAction.buttonLabel}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

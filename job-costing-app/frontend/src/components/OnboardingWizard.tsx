import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const BUSINESS_TYPES = [
  { id: 'Electrical',      emoji: '⚡', label: 'Electrical' },
  { id: 'Plumbing',        emoji: '🔧', label: 'Plumbing' },
  { id: 'Construction',    emoji: '🏗️', label: 'Construction' },
  { id: 'Landscaping',     emoji: '🌿', label: 'Landscaping' },
  { id: 'Painting',        emoji: '🎨', label: 'Painting' },
  { id: 'HVAC',            emoji: '❄️', label: 'HVAC' },
  { id: 'Roofing',         emoji: '🏠', label: 'Roofing' },
  { id: 'Carpentry',       emoji: '🪚', label: 'Carpentry' },
  { id: 'Tiling',          emoji: '🔲', label: 'Tiling' },
  { id: 'Concreting',      emoji: '🧱', label: 'Concreting' },
  { id: 'Cleaning',        emoji: '🧹', label: 'Cleaning' },
  { id: 'Engineering',     emoji: '⚙️', label: 'Engineering' },
  { id: 'Consulting',      emoji: '💼', label: 'Consulting' },
  { id: 'Interior Design', emoji: '🛋️', label: 'Interior Design' },
  { id: 'Surveying',       emoji: '📐', label: 'Surveying' },
  { id: 'Solar',           emoji: '☀️', label: 'Solar' },
  { id: 'Security Systems',emoji: '🔐', label: 'Security Systems' },
  { id: 'Flooring',        emoji: '🪵', label: 'Flooring' },
  { id: 'Glazing',         emoji: '🪟', label: 'Glazing' },
  { id: 'Pest Control',    emoji: '🐛', label: 'Pest Control' },
];

const COUNTRIES = [
  { code: 'NZ', label: 'New Zealand', flag: '🇳🇿' },
  { code: 'AU', label: 'Australia',   flag: '🇦🇺' },
  { code: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'CA', label: 'Canada',      flag: '🇨🇦' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦' },
];

const PROCESSING_MESSAGES = [
  'Analysing your business type…',
  'Designing job templates…',
  'Configuring cost categories…',
  'Setting up tax & invoicing…',
  'Personalising your workspace…',
  'Almost ready…',
];

type Step = 'type' | 'details' | 'processing' | 'result';

interface SetupResult {
  setup: {
    welcomeMessage: string;
    settings: { defaultLaborRate: number; invoicePrefix: string; taxLabel: string; currency: string };
  };
  created: { templates: number; categories: number };
  jobTemplates: Array<{ name: string; description: string }>;
  costCategories: Array<{ name: string }>;
}

interface Props {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('NZ');
  const [processingMsg, setProcessingMsg] = useState(PROCESSING_MESSAGES[0]);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState('');
  const [visibleItems, setVisibleItems] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => { logout(); navigate('/login'); };

  // Cycle processing messages while loading
  useEffect(() => {
    if (step !== 'processing') return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % PROCESSING_MESSAGES.length;
      setProcessingMsg(PROCESSING_MESSAGES[i]);
    }, 1100);
    return () => clearInterval(t);
  }, [step]);

  // Animate result items in one by one
  useEffect(() => {
    if (step !== 'result' || !result) return;
    setVisibleItems(0);
    const total = (result.jobTemplates?.length || 0) + (result.costCategories?.length || 0) + 3;
    let count = 0;
    const t = setInterval(() => {
      count++;
      setVisibleItems(count);
      if (count >= total) clearInterval(t);
    }, 80);
    return () => clearInterval(t);
  }, [step, result]);

  function handleSearchChange(val: string) {
    setTypeSearch(val);
    setSelectedType('');
    setCustomType('');
  }

  const filteredTypes = typeSearch.trim()
    ? BUSINESS_TYPES.filter(bt => bt.label.toLowerCase().includes(typeSearch.toLowerCase()))
    : BUSINESS_TYPES;

  const showCustomOption = typeSearch.trim().length > 1 && filteredTypes.length === 0;

  const effectiveType = selectedType === '__custom__'
    ? customType
    : selectedType || typeSearch.trim();

  const canContinue = effectiveType.trim().length > 0;

  async function runSetup() {
    setStep('processing');
    setError('');
    try {
      const res = await api.post('/onboarding/setup-demo', {
        businessType: effectiveType,
        description,
        country,
      });
      setResult(res.data);
      setStep('result');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong. Please try again.');
      setStep('details');
    }
  }

  const flagFor = (code: string) => COUNTRIES.find(c => c.code === code)?.flag || '🌍';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900">
        <div className="absolute inset-0 opacity-20"
          style={{background: 'radial-gradient(ellipse at 20% 50%, #6366f1 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0ea5e9 0%, transparent 60%)'}} />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
      </div>

      <div className="relative w-full max-w-2xl mx-4">

        {/* ── Step 1: Business Type ── */}
        {step === 'type' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-bold text-lg">✦</div>
                <span className="text-white/60 text-sm font-medium tracking-wide uppercase">Welcome</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">Let's set up your workspace</h1>
              <p className="text-white/60 text-base">What type of business do you run? We'll configure everything for you.</p>
            </div>

            {/* Sign out link */}
            <div className="px-8 pb-2 flex justify-end">
              <button onClick={handleSignOut} className="text-white/30 hover:text-white/60 text-xs transition-colors">Sign out</button>
            </div>

            {/* Search / free-type */}
            <div className="px-8 pb-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-base">🔍</span>
                <input
                  value={typeSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search or type any business (e.g. Pest Control, Arborist…)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-8 py-2.5 text-white placeholder-white/35 focus:outline-none focus:border-primary-400 text-sm transition-colors"
                />
                {typeSearch && (
                  <button
                    onClick={() => { setTypeSearch(''); setSelectedType(''); setCustomType(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xl leading-none"
                  >×</button>
                )}
              </div>
            </div>

            <div className="px-8 pb-4 grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
              {filteredTypes.map(bt => (
                <button
                  key={bt.id}
                  onClick={() => { setSelectedType(bt.id); setCustomType(''); }}
                  className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
                    selectedType === bt.id
                      ? 'border-primary-400 bg-primary-500/30 shadow-lg shadow-primary-500/20 scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{bt.emoji}</span>
                  <span className={`text-xs font-medium text-center leading-tight ${selectedType === bt.id ? 'text-white' : 'text-white/70'}`}>
                    {bt.label}
                  </span>
                  {selectedType === bt.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}

              {/* Custom tile — appears when typed text matches nothing */}
              {showCustomOption && (
                <button
                  onClick={() => { setCustomType(typeSearch.trim()); setSelectedType('__custom__'); }}
                  className={`group relative col-span-2 flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${
                    selectedType === '__custom__'
                      ? 'border-primary-400 bg-primary-500/30 shadow-lg shadow-primary-500/20'
                      : 'border-dashed border-white/25 bg-white/5 hover:border-primary-400/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">✏️</span>
                  <span className={`text-xs font-medium text-center leading-tight ${selectedType === '__custom__' ? 'text-white' : 'text-white/70'}`}>
                    Use &ldquo;{typeSearch.trim()}&rdquo;
                  </span>
                  {selectedType === '__custom__' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              )}

              {!showCustomOption && filteredTypes.length === 0 && typeSearch.trim().length <= 1 && (
                <div className="col-span-4 py-4 text-center text-white/30 text-sm">Keep typing…</div>
              )}
            </div>

            <div className="px-8 pb-8 flex justify-end">
              <button
                disabled={!canContinue}
                onClick={() => setStep('details')}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary-500/30"
              >
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Business Details ── */}
        {step === 'details' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <button onClick={() => setStep('type')} className="text-white/40 hover:text-white/70 text-sm mb-4 flex items-center gap-1 transition-colors">
                ← Back
              </button>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{BUSINESS_TYPES.find(b => b.id === selectedType)?.emoji}</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">{effectiveType}</h1>
                  <p className="text-white/60 text-sm">Tell us a bit more so we can personalise your setup</p>
                </div>
              </div>
            </div>

            <div className="px-8 pb-6 space-y-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Describe your typical work <span className="text-white/30">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={`e.g. "We do residential rewiring and commercial switchboard upgrades. 4-person team based in Auckland."`}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary-400 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Your country</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setCountry(c.code)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-150 text-sm ${
                        country === c.code
                          ? 'border-primary-400 bg-primary-500/30 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <span>{c.flag}</span> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex justify-between items-center">
              <p className="text-white/30 text-xs">🔒 Your data stays private and is never shared</p>
              <button
                onClick={runSetup}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-sky-500 hover:from-primary-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                ✦ Set up my workspace
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Processing ── */}
        {step === 'processing' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 flex flex-col items-center text-center">
            {/* Spinning logo */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-primary-500/40">
                <span className="text-4xl">✦</span>
              </div>
              <div className="absolute inset-0 rounded-3xl border-2 border-primary-400/50 animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">AI is setting up your workspace</h2>
            <p className="text-primary-300 font-medium text-lg transition-all duration-500">{processingMsg}</p>
            <div className="flex gap-1.5 mt-6">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{animationDelay: `${i * 0.15}s`}} />
              ))}
            </div>
            <p className="text-white/30 text-sm mt-6">Powered by Google Gemini</p>
          </div>
        )}

        {/* ── Step 4: Result ── */}
        {step === 'result' && result && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-sky-500/20 border-b border-white/10 px-8 py-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/40">✓</div>
              <div>
                <h2 className="text-xl font-bold text-white">Your workspace is ready! {flagFor(country)}</h2>
                <p className="text-white/60 text-sm mt-0.5">{result.setup?.welcomeMessage}</p>
              </div>
            </div>

            <div className="overflow-y-auto px-8 py-6 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '📋', label: 'Job Templates', value: result.created?.templates },
                  { icon: '🗂️', label: 'Cost Categories', value: result.created?.categories },
                  { icon: '💰', label: 'Labour Rate', value: `${result.setup?.settings?.currency} ${result.setup?.settings?.defaultLaborRate}/hr` },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`bg-white/10 rounded-2xl p-4 text-center border border-white/10 transition-all duration-300 ${visibleItems > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{transitionDelay: `${i * 80}ms`}}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-white/50 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Job Templates */}
              <div>
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">📋 Job Templates Created</h3>
                <div className="space-y-2">
                  {result.jobTemplates?.map((t, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10 transition-all duration-300 ${visibleItems > i + 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                      style={{transitionDelay: `${(i + 3) * 80}ms`}}
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <div>
                        <p className="text-white text-sm font-medium">{t.name}</p>
                        <p className="text-white/40 text-xs mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Categories */}
              <div>
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">🗂️ Cost Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {result.costCategories?.map((c, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-medium rounded-full transition-all duration-300 ${visibleItems > i + 3 + (result.jobTemplates?.length || 0) ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                      style={{transitionDelay: `${(i + 3 + (result.jobTemplates?.length || 0)) * 80}ms`}}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Invoice settings */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-white/40 text-xs mb-1">Tax</div>
                  <div className="text-white font-bold">{result.setup?.settings?.taxLabel} {((result.setup?.settings as any)?.taxRate * 100 || 0).toFixed(0)}%</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-white/40 text-xs mb-1">Currency</div>
                  <div className="text-white font-bold">{result.setup?.settings?.currency}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-white/40 text-xs mb-1">Invoice Prefix</div>
                  <div className="text-white font-bold">{result.setup?.settings?.invoicePrefix}-001</div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 border-t border-white/10">
              <button
                onClick={onComplete}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-sky-500 hover:from-primary-600 hover:to-sky-600 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
              >
                Let's get started 🚀
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        {step !== 'processing' && step !== 'result' && (
          <div className="flex justify-center gap-2 mt-6">
            {(['type','details'] as const).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-primary-400' : 'w-2 bg-white/20'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

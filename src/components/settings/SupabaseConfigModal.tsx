import React, { useState } from 'react';
import { ArrowLeft, Database, Key, Check, ShieldCheck, CreditCard, Copy } from 'lucide-react';
import { updateSupabaseCredentials, isSupabaseConfigured } from '../../services/supabase';
import { getPaystackKey, setPaystackKey } from '../../services/paystack';

interface SupabaseConfigModalProps {
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ onClose }) => {
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('chat_supabase_url') || (import.meta.env.VITE_SUPABASE_URL as string) || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('chat_supabase_anon_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''
  );
  const [paystackKey, setCustomPaystackKey] = useState(getPaystackKey());
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
    setPaystackKey(paystackKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200 select-none">
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Backend & API Setup</h2>
            <p className="text-[11px] text-white/80">Supabase & Paystack Credentials</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 bg-white text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-50 shadow-sm"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
      </header>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6 max-w-lg mx-auto w-full">
        {/* Status card */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Real-Time Database Architecture</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Chat operates with a hybrid architecture: an active local real-time sync engine (zero setup needed to test instantly) and native integration with your live <strong>Supabase</strong> Postgres instance and <strong>Paystack</strong> gateway.
          </p>
        </div>

        {/* Supabase inputs */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Supabase Connection
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project URL
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzproject.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Anon Public API Key
            </label>
            <input
              type="text"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Paystack Public Key input */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Paystack Payment Gateway
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paystack Public Key (Live or Test)
            </label>
            <input
              type="text"
              value={paystackKey}
              onChange={(e) => setCustomPaystackKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default demo key enabled for seamless card & transfer testing. Enter your live key for real payments.
            </span>
          </div>
        </div>

        {/* SQL Schema Notice */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white">Database Schema Included:</span>
            <span className="text-[10px] font-mono text-emerald-600">supabase_schema.sql</span>
          </div>
          <p>
            Complete Postgres tables with RLS, triggers, indexes, and real-time publication are generated in the project root file <code>supabase_schema.sql</code>.
          </p>
        </div>
      </form>
    </div>
  );
};

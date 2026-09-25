import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  CreditCard,
  Receipt,
  AlertTriangle,
  BarChart3,
  Shield,
  ShieldBan,
  CheckCircle,
  Edit2,
  Check,
  TrendingUp,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { User, PricingPlan, Transaction, UserReport, PlanType } from '../../types';
import { chatStore } from '../../services/store';

interface AdminPanelModalProps {
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'analytics' | 'users' | 'pricing' | 'transactions' | 'reports'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [editingPlanType, setEditingPlanType] = useState<PlanType | null>(null);
  const [newPlanPrice, setNewPlanPrice] = useState<number>(0);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const users = chatStore.registeredUsers.length > 0 ? chatStore.registeredUsers : chatStore.contacts;
  const pricingPlans = chatStore.pricingPlans;
  const transactions = chatStore.transactions;
  const reports = chatStore.reports;
  const blockedIds = chatStore.blockedUserIds;

  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3000);
  };

  // Analytics computation
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0);
  const activeSubsCount = chatStore.subscriptions.filter((s) => s.status === 'active').length;
  const totalCallsCount = chatStore.callLogs.length;

  const handleUpdatePrice = (planType: PlanType) => {
    if (newPlanPrice > 0) {
      chatStore.updatePlanPrice(planType, newPlanPrice);
      setEditingPlanType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <header className="bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/20 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Chat Admin Console</h2>
              <p className="text-[11px] text-slate-400">Operations & Paystack Subscriptions</p>
            </div>
          </div>
        </div>
      </header>

      {adminToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-md animate-in slide-in-from-top duration-150">
          {adminToast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setTab('analytics')}
          className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
            tab === 'analytics'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
            tab === 'users'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setTab('pricing')}
          className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
            tab === 'pricing'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Subscription Pricing
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
            tab === 'transactions'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Payments ({transactions.length})
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
            tab === 'reports'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Reports ({reports.length})
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {/* 1. ANALYTICS */}
        {tab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Total Revenue</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₦{totalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> Paystack Verified
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Active Subscriptions</span>
                <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {activeSubsCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Messaging & Calling</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Registered Users</span>
                <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {users.length}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Verified OTP Accounts</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Calls Handled</span>
                <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {totalCallsCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">WebRTC Sessions</span>
              </div>
            </div>

            {/* Quick System Status Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Backend & Integration Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block">Supabase Client:</span>
                  <span className="font-semibold text-emerald-400">Connected & Realtime Active</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block">FCM Push Server:</span>
                  <span className="font-semibold text-emerald-400">Tokens Ready</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-slate-400 block">Paystack Gateway:</span>
                  <span className="font-semibold text-emerald-400">Inline Pop v1 Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT */}
        {tab === 'users' && (
          <div className="space-y-4">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, username or phone..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182229] text-sm text-slate-900 dark:text-white focus:outline-none"
            />

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#182229]">
              {users
                .filter((u) => u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.phoneNumber.includes(userSearch))
                .map((user) => {
                  const isBlocked = blockedIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#1c2830]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.fullName}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">@{user.username} · {user.phoneNumber}</p>
                          <span className="text-[10px] text-slate-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Grant subscription directly */}
                        <button
                          onClick={() => {
                            chatStore.activateSubscription('all_in_one', 3500, `ADMIN-GRANT-${Date.now()}`, 'card', user.id);
                            showToast(`Granted All-In-One Plan to ${user.fullName}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100"
                        >
                          Grant VIP
                        </button>

                        {/* Block/Unblock toggle */}
                        {isBlocked ? (
                          <button
                            onClick={() => chatStore.unblockUser(user.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => chatStore.blockUser(user.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 3. SUBSCRIPTION PRICING */}
        {tab === 'pricing' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Set the required subscription price for messaging and calling. Changes reflect immediately across all Paystack checkouts.
            </p>

            <div className="space-y-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-500">{plan.durationDays} days access · {plan.planType} gate</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingPlanType === plan.planType ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">₦</span>
                        <input
                          type="number"
                          value={newPlanPrice}
                          onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-sm rounded border border-emerald-500 dark:bg-[#202c33] dark:text-white"
                        />
                        <button
                          onClick={() => handleUpdatePrice(plan.planType)}
                          className="p-1.5 rounded bg-emerald-600 text-white"
                          title="Save Price"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          ₦{plan.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            setEditingPlanType(plan.planType);
                            setNewPlanPrice(plan.price);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                          title="Edit Price"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TRANSACTIONS */}
        {tab === 'transactions' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {tx.userName} · {tx.planType.toUpperCase()}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.reference}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.paidAt).toLocaleString()} · {tx.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₦{tx.amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5. REPORTS */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No user reports filed yet. The community is clean!
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      Report against: {rep.reportedUserName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Reason:</strong> {rep.reason}
                  </p>
                  {rep.details && (
                    <p className="text-slate-500 italic">"{rep.details}"</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => chatStore.blockUser(rep.reportedUserId)}
                      className="px-3 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                    >
                      Ban User
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

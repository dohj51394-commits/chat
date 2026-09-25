import React, { useState } from 'react';
import { ArrowLeft, Check, Crown, ShieldAlert, Sparkles, Clock, Receipt, CreditCard } from 'lucide-react';
import { PricingPlan, Subscription, Transaction, User, PlanType } from '../../types';
import { chatStore } from '../../services/store';
import { PaystackCheckoutModal } from './PaystackCheckoutModal';

interface SubscriptionModalProps {
  currentUser: User | null;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [tab, setTab] = useState<'plans' | 'active' | 'history'>('plans');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PricingPlan | null>(null);

  const pricingPlans = chatStore.pricingPlans;
  const subscriptions = chatStore.subscriptions.filter(
    (s) => s.userId === currentUser?.id || s.userId === 'me'
  );
  const transactions = chatStore.transactions.filter(
    (t) => t.userId === currentUser?.id || t.userId === 'me'
  );

  const getSubStatus = (planType: PlanType) => {
    const sub = subscriptions.find(
      (s) => (s.planType === planType || s.planType === 'all_in_one') && s.status === 'active'
    );
    if (!sub) return null;
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    return {
      sub,
      daysLeft,
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-sm font-semibold leading-tight flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Subscriptions & Paystack</span>
            </h2>
            <p className="text-[11px] text-white/80">Manage access plans & receipts</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-100 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setTab('plans')}
          className={`py-3 text-center transition-colors border-b-2 ${
            tab === 'plans'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Available Plans
        </button>
        <button
          onClick={() => setTab('active')}
          className={`py-3 text-center transition-colors border-b-2 ${
            tab === 'active'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Active ({subscriptions.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`py-3 text-center transition-colors border-b-2 ${
            tab === 'history'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
        {/* TAB 1: PLANS */}
        {tab === 'plans' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Access Requirements:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li><strong>Messaging Plan</strong> is required before sending chat messages.</li>
                <li><strong>Voice & Video Calling Plan</strong> is required before making calls.</li>
                <li>Payments are securely processed via <strong>Paystack</strong> (Debit card or Bank transfer).</li>
              </ul>
            </div>

            <div className="space-y-4">
              {pricingPlans.map((plan) => {
                const activeInfo = getSubStatus(plan.planType);
                const isSubscribed = Boolean(activeInfo);

                return (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-2xl border transition-all ${
                      plan.popular
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229]'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {plan.durationDays} days access
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          ₦{plan.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 block">/ month</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      {isSubscribed ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Check className="w-4 h-4" />
                          <span>Active ({activeInfo?.daysLeft} days left)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not subscribed</span>
                      )}

                      <button
                        onClick={() => setSelectedPlanForPayment(plan)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          isSubscribed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                            : 'bg-[#00a884] hover:bg-[#008f70] text-white shadow-md'
                        }`}
                      >
                        {isSubscribed ? 'Renew Plan' : 'Subscribe via Paystack'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE SUBSCRIPTIONS */}
        {tab === 'active' && (
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active subscriptions. Select a plan from Available Plans.
              </div>
            ) : (
              subscriptions.map((sub) => {
                const days = Math.max(
                  0,
                  Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                );
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {sub.planName}
                      </h4>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {days} Days Remaining
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Started: {new Date(sub.startedAt).toLocaleDateString()}</p>
                      <p>Expires: {new Date(sub.expiresAt).toLocaleDateString()}</p>
                      <p>Price: ₦{sub.amount.toLocaleString()} ({sub.currency})</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: TRANSACTIONS HISTORY */}
        {tab === 'history' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No transaction records found.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.planType.toUpperCase()} Subscription
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      Ref: {tx.reference}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(tx.paidAt).toLocaleString()} · {tx.channel === 'card' ? 'Debit Card' : 'Bank Transfer'}
                    </p>
                  </div>

                  <div className="text-right shrink-0 ml-2">
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
      </div>

      {/* Paystack Checkout Modal */}
      {selectedPlanForPayment && (
        <PaystackCheckoutModal
          plan={selectedPlanForPayment}
          currentUser={currentUser}
          onSuccess={() => {
            setSelectedPlanForPayment(null);
            setTab('active');
          }}
          onClose={() => setSelectedPlanForPayment(null)}
        />
      )}
    </div>
  );
};

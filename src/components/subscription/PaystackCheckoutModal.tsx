import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Building2, ShieldCheck, CheckCircle2, Loader2, X, Lock } from 'lucide-react';
import { PricingPlan, User } from '../../types';
import { chatStore } from '../../services/store';
import { generatePaymentReference } from '../../services/paystack';

interface PaystackCheckoutModalProps {
  plan: PricingPlan;
  currentUser: User | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaystackCheckoutModal: React.FC<PaystackCheckoutModalProps> = ({
  plan,
  currentUser,
  onSuccess,
  onClose,
}) => {
  const [method, setMethod] = useState<'card' | 'bank_transfer'>('card');
  const [cardNumber, setCardNumber] = useState('4084 0000 0000 1234');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('889');
  const [cardPin, setCardPin] = useState('1234');
  const [step, setStep] = useState<'input' | 'otp' | 'processing' | 'success'>('input');
  const [otpCode, setOtpCode] = useState('123456');

  const reference = generatePaymentReference(plan.planType);

  const handlePayCard = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => {
      setStep('otp');
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => {
      chatStore.activateSubscription(plan.planType, plan.price, reference, 'card');
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 1500);
  };

  const handleConfirmTransfer = () => {
    setStep('processing');
    setTimeout(() => {
      chatStore.activateSubscription(plan.planType, plan.price, reference, 'bank_transfer');
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#1f2c34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60">
        {/* Paystack Top Header */}
        <div className="bg-[#0ba4db] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">Paystack Checkout</h3>
              <p className="text-[11px] text-white/80">Secured & Encrypted Payment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-slate-50 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Subscribing to:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Amount:</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              ₦{plan.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* PROCESSING STATE */}
        {step === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#0ba4db] animate-spin" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Processing payment...
            </h4>
            <p className="text-xs text-slate-500">Contacting Paystack gateway. Please do not refresh.</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {step === 'success' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce" />
            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Payment Successful!</h4>
            <p className="text-xs text-slate-500">
              Your {plan.name} has been activated immediately.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
              Ref: {reference}
            </div>
          </div>
        )}

        {/* OTP VERIFICATION STEP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">3D Secure OTP</h4>
              <p className="text-xs text-slate-500">
                A verification code was sent to your bank registered device.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Enter One-Time Password
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest font-mono text-lg py-2.5 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0ba4db] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0ba4db] hover:bg-[#0993c5] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Verify & Complete Payment
            </button>
          </form>
        )}

        {/* INPUT STEP */}
        {step === 'input' && (
          <div className="p-5 space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#182229] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMethod('card')}
                className={`py-2 flex items-center justify-center gap-2 rounded-lg transition-colors ${
                  method === 'card'
                    ? 'bg-white dark:bg-[#233138] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Debit Card</span>
              </button>
              <button
                onClick={() => setMethod('bank_transfer')}
                className={`py-2 flex items-center justify-center gap-2 rounded-lg transition-colors ${
                  method === 'bank_transfer'
                    ? 'bg-white dark:bg-[#233138] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* CARD FORM */}
            {method === 'card' && (
              <form onSubmit={handlePayCard} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="5399 0000 0000 0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Expires (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ba4db]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0ba4db] hover:bg-[#0993c5] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] mt-2"
                >
                  Pay ₦{plan.price.toLocaleString()}
                </button>
              </form>
            )}

            {/* BANK TRANSFER FORM */}
            {method === 'bank_transfer' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-[#182229] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <p className="text-slate-500">Transfer exactly the required amount to:</p>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Bank Name: <span className="font-bold text-emerald-600">Paystack-Titan / Wema Bank</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Account Number: <span className="font-mono text-base font-bold text-slate-900 dark:text-white">9934182901</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Amount: <span className="font-bold text-emerald-600">₦{plan.price.toLocaleString()}</span>
                    </p>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Use this dedicated account for this transaction only. Expires in 30 minutes.
                  </p>
                </div>

                <button
                  onClick={handleConfirmTransfer}
                  className="w-full py-3 bg-[#0ba4db] hover:bg-[#0993c5] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  I Have Sent the Money
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

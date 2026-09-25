import React, { useState } from 'react';
import { ArrowLeft, Phone, Lock, User as UserIcon, ShieldCheck, Check, KeyRound, Sparkles } from 'lucide-react';
import { chatStore } from '../../services/store';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', name: 'United States & Canada', flag: '🇺🇸' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'recovery'>('login');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setOtpCode(randomCode); // auto-populate for seamless verification
    setMode('otp');
    setResendTimer(30);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) return;

    if (fullName) {
      chatStore.register(fullName.trim(), username.trim() || fullName.trim(), phoneNumber.trim(), countryCode);
    } else {
      chatStore.login(`${countryCode} ${phoneNumber.trim()}`, password);
    }
    onSuccess();
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryNotice(`A password reset link and OTP has been dispatched to ${countryCode} ${phoneNumber}`);
    setTimeout(() => {
      setRecoveryNotice(null);
      setMode('login');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#1f2c34] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60">
        {/* Header */}
        <div className="bg-[#008069] dark:bg-[#182229] p-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1 rounded-full hover:bg-black/10 text-white/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">
            {mode === 'otp'
              ? 'Verify Your Phone'
              : mode === 'register'
              ? 'Create Chat Account'
              : mode === 'recovery'
              ? 'Reset Password'
              : 'Sign In to Chat'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {mode === 'otp'
              ? `Enter code sent to ${countryCode} ${phoneNumber}`
              : 'End-to-end encrypted Android messaging'}
          </p>
        </div>

        {/* OTP Screen */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            {generatedOtp && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-300">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Simulated SMS Delivery:</span>
                <span className="text-lg font-mono font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                  {generatedOtp}
                </span>
              </div>
            )}

            <div className="text-center">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-2xl py-2.5 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a884] outline-none text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f70] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Verify & Continue
            </button>

            <div className="text-center text-xs text-slate-400">
              Didn't receive code?{' '}
              <button
                type="button"
                onClick={() => setResendTimer(30)}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Resend SMS
              </button>
            </div>
          </form>
        )}

        {/* PASSWORD RECOVERY SCREEN */}
        {mode === 'recovery' && (
          <form onSubmit={handleRecovery} className="p-6 space-y-4">
            {recoveryNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl text-center font-medium">
                {recoveryNotice}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Your Registered Phone
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f70] text-white font-bold text-sm rounded-xl shadow-md"
            >
              Send Reset Code
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* LOGIN / REGISTER FORMS */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSendOtp} className="p-6 space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00a884]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00a884]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="801 234 5678"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00a884]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00a884]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#00a884] hover:bg-[#008f70] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] mt-2"
            >
              {mode === 'login' ? 'Next (Verify OTP)' : 'Create Account & Verify OTP'}
            </button>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  New to Chat?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Create account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

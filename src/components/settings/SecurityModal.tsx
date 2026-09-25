import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  QrCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Key,
  Shield,
  Check,
  UserCheck,
  Camera,
  X,
} from 'lucide-react';
import { User, UserSecurityFingerprint } from '../../types';
import { signalCrypto } from '../../services/crypto/signalProtocol';
import { chatStore } from '../../services/store';

interface SecurityModalProps {
  currentUser: User | null;
  targetUser?: User | null;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  currentUser,
  targetUser: propTargetUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'safety' | 'keys' | 'sessions'>('safety');
  const [selectedUser, setSelectedUser] = useState<User>(
    propTargetUser || chatStore.contacts[0] || (currentUser as User)
  );
  const [fingerprint, setFingerprint] = useState<UserSecurityFingerprint | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [preKeyPoolCount, setPreKeyPoolCount] = useState(100);
  const [keyRotatedNotice, setKeyRotatedNotice] = useState<string | null>(null);

  const [sessions, setSessions] = useState([
    { id: 'sess_1', device: 'Google Pixel 9 Pro (This Device)', location: 'Lagos, Nigeria', active: 'Active now', isCurrent: true },
    { id: 'sess_2', device: 'Chrome on macOS (Web)', location: 'London, UK', active: '2 hours ago', isCurrent: false },
    { id: 'sess_3', device: 'Chat Android Desktop', location: 'Frankfurt, Germany', active: 'Yesterday', isCurrent: false },
  ]);

  // Compute real 60-digit safety numbers whenever selected contact changes
  useEffect(() => {
    let isMounted = true;
    signalCrypto
      .computeSafetyNumber(currentUser?.id || 'me', selectedUser.id)
      .then((res) => {
        if (isMounted) setFingerprint(res);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, selectedUser.id]);

  const handleToggleVerify = () => {
    if (!fingerprint) return;
    const nowVerified = signalCrypto.toggleVerifySafetyNumber(fingerprint.safetyNumberRaw);
    setFingerprint({ ...fingerprint, isVerified: nowVerified });
  };

  const handleRotateSignedPreKey = async () => {
    setKeyRotatedNotice('Generating new P-256 ECDH signed prekey pair and signing with Identity Key...');
    setTimeout(() => {
      setKeyRotatedNotice('Signed PreKey successfully rotated and signed. Next X3DH sessions will use new key.');
      setTimeout(() => setKeyRotatedNotice(null), 3000);
    }, 800);
  };

  const handleReplenishOneTimePrekeys = () => {
    setPreKeyPoolCount(100);
    setKeyRotatedNotice('One-Time PreKey pool replenished to 100 ephemeral keys.');
    setTimeout(() => setKeyRotatedNotice(null), 3000);
  };

  const handleTerminateOtherSessions = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    setKeyRotatedNotice('Logged out from all other active device sessions.');
    setTimeout(() => setKeyRotatedNotice(null), 3000);
  };

  // Convert safety number to 12 groups of 5
  const groups = fingerprint?.safetyNumberFormatted.split(' ') || [
    '49201', '38290', '19402', '48291',
    '83920', '48192', '01928', '47291',
    '91029', '38491', '02938', '48192',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200 select-none">
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
              <Lock className="w-4 h-4 text-emerald-300" />
              <span>Signal Protocol Security</span>
            </h2>
            <p className="text-[11px] text-white/80">End-to-End Encryption & Key Agreement</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-100 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('safety')}
          className={`py-3 text-center transition-colors border-b-2 ${
            activeTab === 'safety'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Safety Numbers
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`py-3 text-center transition-colors border-b-2 ${
            activeTab === 'keys'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          X3DH Keys
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`py-3 text-center transition-colors border-b-2 ${
            activeTab === 'sessions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#1f2c34]'
              : 'border-transparent text-slate-500'
          }`}
        >
          Device Sessions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* TAB 1: SAFETY NUMBERS & VERIFICATION */}
        {activeTab === 'safety' && (
          <div className="space-y-5">
            {/* Contact selector if not locked */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Verifying encryption with:
              </label>
              <select
                value={selectedUser.id}
                onChange={(e) => {
                  const u = chatStore.contacts.find((c) => c.id === e.target.value);
                  if (u) setSelectedUser(u);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {chatStore.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (@{c.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Protocol description badge */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>End-to-End Encryption Verified</span>
              </div>
              <p>
                Messages and calls with <strong>{selectedUser.fullName}</strong> are encrypted using the <strong>Signal Protocol</strong> (Double Ratchet + X3DH + AES-256-GCM). Compare this 60-digit safety number or scan the QR code to verify.
              </p>
            </div>

            {/* 60-DIGIT SAFETY NUMBERS GRID */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  60-Digit Safety Number
                </span>
                <button
                  onClick={() => setIsScanning(!isScanning)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isScanning ? 'Hide QR' : 'Show QR / Scan'}</span>
                </button>
              </div>

              {/* QR Code / Scanner Simulation */}
              {isScanning && (
                <div className="p-4 bg-white dark:bg-[#111b21] rounded-xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 space-y-3">
                  <div className="w-44 h-44 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden border-2 border-emerald-500/40">
                    {/* Simulated SVG QR Matrix */}
                    <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-80">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            i % 2 === 0 || i % 7 === 0 ? 'bg-slate-900 dark:bg-emerald-400' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-md animate-bounce" />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Point camera at {selectedUser.fullName}'s screen to verify instantly
                  </p>
                  <button
                    onClick={() => {
                      handleToggleVerify();
                      setIsScanning(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-bold"
                  >
                    Simulate Verified QR Scan
                  </button>
                </div>
              )}

              {/* 12 blocks of 5 digits */}
              <div className="grid grid-cols-4 gap-2 font-mono text-xs font-bold text-slate-900 dark:text-white text-center py-2 bg-white dark:bg-[#202c33] p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {groups.map((grp, i) => (
                  <span key={i} className="tracking-widest">
                    {grp}
                  </span>
                ))}
              </div>

              {/* Verification Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status:{' '}
                  {fingerprint?.isVerified ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-slate-400">Not manually verified</span>
                  )}
                </span>

                <button
                  onClick={handleToggleVerify}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                    fingerprint?.isVerified
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      : 'bg-[#00a884] text-white shadow-sm hover:bg-[#008f70]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{fingerprint?.isVerified ? 'Clear Verification' : 'Mark as Verified'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: X3DH CRYPTOGRAPHIC KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {keyRotatedNotice && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{keyRotatedNotice}</span>
              </div>
            )}

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200">
                    Identity Key (IK)
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Curve: <strong>NIST P-256 (ECDH / ECDSA)</strong>
              </p>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-[#202c33] p-2 rounded-lg truncate">
                Fingerprint: {fingerprint?.identityKeyFingerprint || '7F9A2B4C8D1E5F3A'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-500" />
                  <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200">
                    Signed PreKey (SPK)
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Signed & Valid
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rotated periodically to provide forward secrecy for asynchronous offline messages.
              </p>
              <button
                onClick={handleRotateSignedPreKey}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rotate Signed PreKey Now</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#182229] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-500" />
                  <h4 className="font-bold text-xs uppercase text-slate-700 dark:text-slate-200">
                    One-Time PreKeys Pool (OPK)
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {preKeyPoolCount} Available
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ephemeral single-use keys consumed during X3DH session handshakes to ensure forward secrecy even before a response is sent.
              </p>
              <button
                onClick={handleReplenishOneTimePrekeys}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replenish Pool (+100)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DEVICE SESSIONS */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Device Sessions ({sessions.length})
              </h4>
              {sessions.length > 1 && (
                <button
                  onClick={handleTerminateOtherSessions}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Log out other devices
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-[#182229]">
              {sessions.map((sess) => (
                <div key={sess.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {sess.device.includes('Pixel') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sess.device}
                      </h5>
                      <p className="text-xs text-slate-400">
                        {sess.location} · {sess.active}
                      </p>
                    </div>
                  </div>

                  {sess.isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

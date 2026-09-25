import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Check, X } from 'lucide-react';
import { chatStore } from '../../services/store';

interface ReportModalProps {
  reportedUserId: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ reportedUserId, onClose }) => {
  const [reason, setReason] = useState('Spam or advertising');
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(true);

  const reasons = [
    'Spam or advertising',
    'Harassment or hate speech',
    'Fake account or impersonation',
    'Inappropriate or illegal content',
    'Other reason',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    chatStore.reportUser(reportedUserId, reason, details.trim() || undefined);
    if (blockUser) {
      chatStore.blockUser(reportedUserId);
    }
    alert('Report submitted. Thank you for helping keep Chat safe.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#202c33] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60">
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">Report User</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Reason for reporting
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-600"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Additional Details (optional)
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full p-2.5 bg-slate-50 dark:bg-[#182229] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={blockUser}
              onChange={(e) => setBlockUser(e.target.checked)}
              className="accent-rose-600 rounded"
            />
            <span>Also block this contact</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

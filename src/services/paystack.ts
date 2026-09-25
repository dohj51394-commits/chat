import { Transaction, PlanType } from '../types';

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // in minor units (e.g. kobo or cents)
  currency?: string;
  ref?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: { reference: string; status: string; trans?: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string; status: string; trans?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export const getPaystackKey = (): string => {
  const customKey = localStorage.getItem('chat_paystack_public_key');
  return customKey || (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) || 'pk_test_chat_demo_key_77819';
};

export const setPaystackKey = (key: string) => {
  if (key) localStorage.setItem('chat_paystack_public_key', key);
  else localStorage.removeItem('chat_paystack_public_key');
};

export const generatePaymentReference = (planType: PlanType): string => {
  return `CHAT-${planType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

'use client';

import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { openRazorpayCheckout } from '../lib/razorpay';

export interface RazorpayCheckoutButtonProps {
  amount: number; // in INR by default (or paise if isPaise=true)
  isPaise?: boolean;
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  buttonText?: string;
  className?: string;
  onPaymentSuccess?: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    verificationResult?: any;
  }) => void;
  onPaymentError?: (error: Error | string) => void;
}

export function RazorpayCheckoutButton({
  amount,
  isPaise = false,
  currency = 'INR',
  receipt,
  name = 'PadhaiPilot',
  description = 'Online Fee Payment',
  prefill,
  notes,
  buttonText,
  className = '',
  onPaymentSuccess,
  onPaymentError,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const displayAmount = isPaise ? (amount / 100).toFixed(2) : amount.toFixed(2);

  const handleCheckout = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      await openRazorpayCheckout({
        amount,
        isPaise,
        currency,
        receipt,
        name,
        description,
        prefill,
        notes,
        onSuccess: (res) => {
          setLoading(false);
          setStatusMessage({
            type: 'success',
            text: `Payment verified! Reference: ${res.razorpay_payment_id}`,
          });
          onPaymentSuccess?.(res);
        },
        onError: (err) => {
          setLoading(false);
          const msg = typeof err === 'string' ? err : err?.message || 'Payment failed.';
          setStatusMessage({
            type: 'error',
            text: msg,
          });
          onPaymentError?.(err);
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setLoading(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to open payment gateway.',
      });
      onPaymentError?.(err);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Order...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ₹${displayAmount}`}</span>
          </>
        )}
      </button>

      {statusMessage && (
        <div
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="truncate">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}

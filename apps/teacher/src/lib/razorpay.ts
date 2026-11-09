'use client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  amount: number; // in INR or paise
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
  onSuccess: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    verificationResult?: any;
  }) => void;
  onError?: (error: Error | string) => void;
  onDismiss?: () => void;
}

function getApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api';
    }
    return 'https://padhai-pilot.vercel.app/api';
  }
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

/**
 * Dynamically loads the official Razorpay Standard Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script from checkout.razorpay.com');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Executes Razorpay Standard Checkout:
 * 1. Calls backend POST /api/create-order
 * 2. Opens Razorpay modal with order_id
 * 3. On success, calls backend POST /api/verify-payment
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    const err = new Error('Razorpay SDK could not be loaded. Please check your internet connection.');
    options.onError?.(err);
    throw err;
  }

  // Calculate amount in paise (min 100 paise = 1 INR)
  const amountInPaise = options.isPaise ? Math.round(options.amount) : Math.round(options.amount * 100);

  if (amountInPaise < 100) {
    const err = new Error('Minimum order amount must be at least ₹1.00 (100 paise).');
    options.onError?.(err);
    throw err;
  }

  const apiBase = getApiBaseUrl();

  // STEP 1: BACKEND - Create Order
  let orderData: { order_id: string; amount: number; currency: string; receipt?: string };
  try {
    const res = await fetch(`${apiBase}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Order creation failed with status ${res.status}`);
    }

    orderData = await res.json();
  } catch (err: any) {
    const error = new Error(err.message || 'Failed to initiate payment order.');
    options.onError?.(error);
    throw error;
  }

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    const err = new Error('Razorpay key is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.');
    options.onError?.(err);
    throw err;
  }

  // STEP 2: FRONTEND - Razorpay Checkout Modal
  const rzpOptions = {
    key: razorpayKey,
    amount: orderData.amount,
    currency: orderData.currency,
    name: options.name || 'PadhaiPilot',
    description: options.description || 'Secure Online Payment',
    image: '/logo.png',
    order_id: orderData.order_id,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: '#1677FF',
    },
    modal: {
      ondismiss: () => {
        options.onDismiss?.();
      },
      escape: true,
      backdropclose: false,
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      // STEP 3: BACKEND - Verify Signature
      try {
        const verifyRes = await fetch(`${apiBase}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        if (!verifyRes.ok) {
          const verifyErr = await verifyRes.json().catch(() => ({}));
          throw new Error(verifyErr.message || 'Payment signature verification failed.');
        }

        const verificationResult = await verifyRes.json();
        options.onSuccess({
          ...response,
          verificationResult,
        });
      } catch (verifyErr: any) {
        options.onError?.(verifyErr instanceof Error ? verifyErr : new Error(String(verifyErr)));
      }
    },
  };

  const rzp = new window.Razorpay(rzpOptions);

  rzp.on('payment.failed', (response: any) => {
    const failureMsg = response?.error?.description || response?.error?.reason || 'Payment processing failed.';
    options.onError?.(new Error(failureMsg));
  });

  rzp.open();
}

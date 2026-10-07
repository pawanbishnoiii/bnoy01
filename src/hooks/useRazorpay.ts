// Razorpay test-mode integration. Uses public test key from Razorpay docs.
declare global { interface Window { Razorpay?: any } }

const TEST_KEY = 'rzp_test_1DP5mmOlF5G5ag';

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type RzpOpts = {
  amount: number; // in rupees — converted to paise here
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string) => void;
  onFailure?: () => void;
};

export function useRazorpay() {
  const openPayment = async (opts: RzpOpts) => {
    const ok = await loadScript();
    if (!ok || !window.Razorpay) {
      opts.onFailure?.();
      return;
    }
    const rzp = new window.Razorpay({
      key: TEST_KEY,
      amount: Math.round(opts.amount * 100),
      currency: 'INR',
      name: 'DevMarket',
      description: opts.description,
      image: '/favicon.ico',
      prefill: opts.prefill || {},
      theme: { color: '#FF5722' },
      handler: (res: any) => opts.onSuccess(res.razorpay_payment_id),
      modal: { ondismiss: () => opts.onFailure?.() },
    });
    rzp.open();
  };
  return { openPayment };
}

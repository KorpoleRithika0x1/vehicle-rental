import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { CheckCircle, X } from 'lucide-react';

import { confirmPayment, createPaymentIntent } from '../../api/payments';
import { useUiStore } from '../../store/uiStore';

// Load Stripe once outside component to avoid re-instantiation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1e293b',
      fontFamily: 'inherit',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#e11d48' },
  },
};

function formatINR(paise) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100,
  );
}

// ── Inner form — must be inside <Elements> ────────────────────────────────
function CheckoutForm({ intent, bookingMeta, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const showToast = useUiStore((state) => state.showToast);
  const [isPaying, setIsPaying] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [confirmed, setConfirmed] = useState(null); // { booking_id }

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStripeError('');
    setIsPaying(true);

    try {
      // 1. Confirm card payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        setStripeError(error.message || 'Payment failed. Please try again.');
        setIsPaying(false);
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        setStripeError(`Unexpected payment status: ${paymentIntent.status}. Please try again.`);
        setIsPaying(false);
        return;
      }

      // 2. Tell backend to verify + create booking
      const result = await confirmPayment({
        payment_intent_id: paymentIntent.id,
        vehicle_id: bookingMeta.vehicle_id,
        pickup_date: bookingMeta.pickup_date,
        return_date: bookingMeta.return_date,
        pickup_address: bookingMeta.pickup_address,
      });

      setConfirmed(result);
      onSuccess?.(result);
    } catch (err) {
      if (err?.statusCode === 409) {
        showToast({ type: 'error', message: err.normalizedMessage || 'Booking could not be completed.' });
      }
      setStripeError(err?.normalizedMessage || 'Something went wrong. Please try again.');
      setIsPaying(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-9 w-9 text-emerald-600" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-ink">Booking Confirmed!</h3>
        <p className="mt-2 text-sm text-slate-500">
          Booking ID: <span className="font-semibold text-brand">#{confirmed.booking_id}</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Total paid: {formatINR(intent.amount)}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Done
        </button>
      </div>
    );
  }

  // ── Payment form ───────────────────────────────────────────────────────
  return (
    <form onSubmit={handlePay} className="space-y-5">
      {/* Booking summary */}
      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-ink">{bookingMeta.vehicle_name}</p>
        <p className="mt-1 text-slate-500">
          {new Date(bookingMeta.pickup_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' → '}
          {new Date(bookingMeta.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        <p className="mt-2 text-xl font-bold text-brand">{formatINR(intent.amount)}</p>
      </div>

      {/* Card input */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-600">Card Details</label>
        <div className="rounded-2xl border border-slate-200 px-4 py-3.5 focus-within:border-brand">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Test card: <span className="font-mono font-semibold">4242 4242 4242 4242</span> · any future date · any CVC
        </p>
      </div>

      {/* Stripe error */}
      {stripeError && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {stripeError}
          <button
            type="button"
            onClick={() => setStripeError('')}
            className="ml-2 font-semibold underline"
          >
            Try Again
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isPaying || !stripe}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
      >
        {isPaying ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing…
          </>
        ) : (
          `Pay ${formatINR(intent.amount)}`
        )}
      </button>
    </form>
  );
}

// ── Outer modal — handles intent creation + Stripe provider ───────────────
export default function PaymentModal({ vehicle, pickupDate, returnDate, pickupAddress, onClose, onSuccess }) {
  const [intent, setIntent] = useState(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await createPaymentIntent({
        vehicle_id: vehicle.id,
        pickup_date: new Date(pickupDate).toISOString(),
        return_date: new Date(returnDate).toISOString(),
        pickup_address: pickupAddress || undefined,
      });
      setIntent(data);
    } catch (err) {
      setLoadError(err?.normalizedMessage || 'Failed to initialise payment. Please try again.');
    }
  }, [vehicle.id, pickupDate, returnDate, pickupAddress]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl text-ink">Complete Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading intent */}
        {!intent && !loadError && (
          <div className="flex items-center justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        )}

        {/* Error loading intent */}
        {loadError && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>
            <button
              type="button"
              onClick={load}
              className="w-full rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stripe form */}
        {intent && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              intent={intent}
              bookingMeta={{
                vehicle_id: vehicle.id,
                vehicle_name: vehicle.vehicle_name,
                pickup_date: new Date(pickupDate).toISOString(),
                return_date: new Date(returnDate).toISOString(),
                pickup_address: pickupAddress,
              }}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

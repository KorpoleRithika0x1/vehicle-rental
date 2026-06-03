import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { submitReview } from '../../api/reviews';
import { useUiStore } from '../../store/uiStore';

export default function ReviewModal({ booking, onClose, onSubmitted }) {
  const showToast = useUiStore((s) => s.showToast);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await submitReview({ booking_id: booking.id, rating, title: title.trim() || null, comment: comment.trim() || null });
      showToast({ type: 'success', message: 'Review submitted. Thank you!' });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err?.normalizedMessage || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Your Feedback</p>
        <h2 className="mt-2 font-heading text-2xl text-ink">Rate your rental</h2>
        <p className="mt-1 text-sm text-slate-400">
          {booking.vehicle_name} · Booking #{booking.id}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Star rating */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600">Overall experience</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition"
                >
                  <Star
                    className={`h-8 w-8 transition ${
                      star <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hovered || rating] || 'Select a rating'}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarise your experience"
              maxLength={150}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-600">What went well or could be better?</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this vehicle..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, ZoomIn } from 'lucide-react';

import { approveAccount, fetchVerificationQueue, fetchVerificationStats, rejectAccount } from '../../api/verification';
import DashboardShell from '../../components/dashboard/DashboardShell';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

// ── Lightbox ──────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
      >
        ✕
      </button>
    </div>
  );
}

// ── Reject dialog ─────────────────────────────────────────────────────────
function RejectDialog({ user, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function handleConfirm() {
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
        <h3 className="font-heading text-2xl text-ink">Reject Account</h3>
        <p className="mt-2 text-sm text-slate-500">
          Provide a reason so <strong>{user.name}</strong> understands why their account was not approved.
        </p>
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-600">Reason for rejection</label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder="e.g. License image is blurry, please resubmit with a clearer photo"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-rose-400 focus:outline-none resize-none"
          />
          {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-slate-100 bg-white p-6 shadow-soft">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-9 flex-1 rounded-full bg-slate-200" />
        <div className="h-9 flex-1 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function VerificationQueue() {
  const { user } = useAuth();
  const showToast = useUiStore((s) => s.showToast);
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { src, alt }
  const [rejectTarget, setRejectTarget] = useState(null); // user object
  const [actionLoading, setActionLoading] = useState({}); // { [userId]: true }

  const managerLinks = [
    { label: 'Dashboard',       to: '/dashboard/manager',              end: true },
    { label: 'Add Car',         to: '/dashboard/manager/vehicles/add', end: true },
    { label: 'Manage Cars',     to: '/dashboard/manager/vehicles',     end: true },
    { label: 'Manage Bookings', to: '/dashboard/manager/bookings' },
    { label: 'Update Profile',  to: '/dashboard/manager/profile' },
  ];

  const adminLinks = [
    { label: 'Dashboard', to: '/dashboard/admin', end: true },
    { label: 'Manage Users', to: '/dashboard/admin/users' },
    { label: 'Manage Managers', to: '/dashboard/admin/managers' },
    { label: 'License Verifications', to: '/dashboard/admin/licenses' },
  ];

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.allSettled([
        fetchVerificationQueue({ page: 1, page_size: 50 }),
        isAdmin ? fetchVerificationStats() : Promise.resolve(null),
      ]);
      if (queueRes.status === 'fulfilled') setItems(queueRes.value.items || []);
      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value);
    } catch {
      showToast({ type: 'error', message: 'Failed to load verification queue.' });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(userId) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await approveAccount(userId);
      showToast({ type: 'success', message: 'Account approved. Customer can now log in.' });
      setItems((prev) => prev.filter((u) => u.id !== userId));
      if (stats) setStats((s) => ({ ...s, pending: s.pending - 1, approved: s.approved + 1 }));
    } catch (err) {
      showToast({ type: 'error', message: err?.normalizedMessage || 'Failed to approve account.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function handleRejectConfirm(reason) {
    const target = rejectTarget;
    setRejectTarget(null);
    setActionLoading((prev) => ({ ...prev, [target.id]: true }));
    try {
      await rejectAccount(target.id, reason);
      showToast({ type: 'success', message: 'Account rejected.' });
      setItems((prev) => prev.filter((u) => u.id !== target.id));
      if (stats) setStats((s) => ({ ...s, pending: s.pending - 1, rejected: s.rejected + 1 }));
    } catch (err) {
      showToast({ type: 'error', message: err?.normalizedMessage || 'Failed to reject account.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [target.id]: false }));
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <>
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
      {rejectTarget && (
        <RejectDialog
          user={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <DashboardShell
        title="License Verification Queue"
        subtitle="Review customer license and live photo submissions"
        links={isAdmin ? adminLinks : managerLinks}
      >
        {/* Admin stat cards */}
        {isAdmin && stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Pending</p>
              <p className="mt-2 text-4xl font-bold text-amber-700">{stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Approved</p>
              <p className="mt-2 text-4xl font-bold text-emerald-700">{stats.approved}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">Rejected</p>
              <p className="mt-2 text-4xl font-bold text-rose-700">{stats.rejected}</p>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white py-20 text-center shadow-soft">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
            <p className="mt-4 text-lg font-semibold text-ink">No pending verifications</p>
            <p className="mt-1 text-sm text-slate-400">All submissions have been reviewed.</p>
          </div>
        ) : (
          /* Pending cards */
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-soft">
                {/* Customer info */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.email}</p>
                    {item.phone_number && <p className="text-sm text-slate-400">{item.phone_number}</p>}
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Submitted: {formatDate(item.created_at)}
                </p>

                {/* Images side by side */}
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {/* License */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Driving License
                    </p>
                    <div
                      className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200"
                      onClick={() => setLightbox({ src: item.license_image_url, alt: 'Driving License' })}
                    >
                      <img
                        src={item.license_image_url}
                        alt="Driving License"
                        className="h-48 w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>

                  {/* Live photo */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Live Photo
                    </p>
                    <div
                      className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200"
                      onClick={() => setLightbox({ src: item.live_photo_url, alt: 'Live Photo' })}
                    >
                      <img
                        src={item.live_photo_url}
                        alt="Live Photo"
                        className="h-48 w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={actionLoading[item.id]}
                    onClick={() => handleApprove(item.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {actionLoading[item.id] ? 'Processing…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading[item.id]}
                    onClick={() => setRejectTarget(item)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardShell>
    </>
  );
}

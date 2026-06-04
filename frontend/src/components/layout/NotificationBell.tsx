import { Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useGetNotificationsQuery, useMarkAllReadMutation } from '../../api/notificationsApi';

export default function NotificationBell() {
  const { user } = useAuth();
  const { data, refetch } = useGetNotificationsQuery(false, {
    pollingInterval: 30000,
    skip: !user,
  });
  const [markAllRead] = useMarkAllReadMutation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const notifications = useMemo(() => data?.notifications?.slice(0, 20) ?? [], [data?.notifications]);
  const unreadCount = data?.unread_count ?? 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!user) return null;

  async function handleToggle() {
    if (!open && unreadCount > 0) {
      await markAllRead().unwrap().catch(() => {});
      refetch();
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-full bg-slate-100 p-2 text-slate-600 transition hover:text-brand"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 320, zIndex: 50 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Notifications</h3>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl px-3 py-3 hover:bg-slate-50 ${!n.is_read ? 'bg-brand/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    ) : null}
                    <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{n.title}</div>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{n.message}</p>
                  <div className="mt-1.5 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

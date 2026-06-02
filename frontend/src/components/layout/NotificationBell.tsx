import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useMemo } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useGetNotificationsQuery, useMarkAllReadMutation } from '../../api/notificationsApi';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

export default function NotificationBell() {
  const { user } = useAuth();
  const { data, refetch } = useGetNotificationsQuery(false, {
    pollingInterval: 30000,
    skip: !user,
  });
  const [markAllRead] = useMarkAllReadMutation();

  const notifications = useMemo(() => data?.notifications?.slice(0, 20) ?? [], [data?.notifications]);
  const unreadCount = data?.unread_count ?? 0;

  if (!user) return null;

  async function handleOpen() {
    if (unreadCount > 0) {
      await markAllRead().unwrap().catch(() => {});
      refetch();
    }
  }

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={handleOpen}
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
        </PopoverTrigger>

        <PopoverContent className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="rounded-xl px-3 py-3 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-ink">{n.title}</div>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{n.message}</p>
                  <div className="mt-1.5 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet</div>
            )}
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}

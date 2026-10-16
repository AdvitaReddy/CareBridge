import { useState } from 'react';
import { Bell, Check, ClipboardList, FileText, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDateTime } from '@/data/mockData';

const notificationPresentation: Record<string, { label: string; icon: typeof Bell }> = {
  caregiver_task: { label: 'Caregiver Task', icon: ClipboardList },
  task: { label: 'Caregiver Task', icon: ClipboardList },
  visit: { label: 'Visit', icon: FileText },
};

export default function NotificationCenter() {
  const { notifications, markNotificationRead } = useApp();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const openNotification = (notificationId: string, linkedId: string | null) => {
    void markNotificationRead(notificationId).catch((error: unknown) => console.error('Unable to mark notification read:', error));
    setOpen(false);
    window.setTimeout(() => {
      if (linkedId) {
        window.dispatchEvent(new CustomEvent('carebridge:open-care-event', { detail: { linkedId } }));
      } else {
        document.getElementById('shared-care-timeline')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-xl text-neutral-600 hover:bg-primary-50 transition-colors"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-danger-500 text-white text-[10px] leading-4 font-bold ring-2 ring-primary-100">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="font-display font-bold text-sm text-neutral-800">Notifications</h2>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100" aria-label="Close notifications">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-400">No notifications yet.</p>
            ) : notifications.map((notification) => {
                const presentation = notificationPresentation[notification.type.toLowerCase().replace(/[\s-]+/g, '_')];
                const Icon = presentation?.icon ?? Bell;
                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification.id, notification.linked_id)}
                    className={`w-full border-b border-neutral-100 px-4 py-3 text-left last:border-b-0 hover:bg-primary-50 ${notification.read ? 'bg-white' : 'bg-primary-50/70'}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-neutral-400">
                        <Icon className="w-3.5 h-3.5" />
                        {presentation?.label ?? notification.type.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center gap-2">
                        {notification.priority === 'high' && <span className="text-[10px] font-bold uppercase text-danger-600">High priority</span>}
                        {notification.read && <Check className="w-3.5 h-3.5 text-success-600" aria-label="Read" />}
                      </span>
                    </span>
                    <span className="block text-sm text-neutral-800 mt-1">{notification.message}</span>
                    <span className="block text-xs text-neutral-400 mt-1">{formatDateTime(notification.created_at)}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, ChevronRight, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService, AppNotification } from '../services/notificationService';
import { supabase } from '../lib/supabase';

type NotificationBellProps = {
  className?: string;
  variant?: 'light' | 'teacher';
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const typeLabel = (type: string) => {
  switch (type) {
    case 'EXAM_PAPER': return 'Exam paper';
    case 'NOTE': return 'Notes';
    case 'CLASS_NOTE': return 'Class notes';
    case 'CLASS_QUIZ': return 'Class quiz';
    default: return 'Update';
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '', variant = 'light' }) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  const unreadCount = useMemo(() => items.filter(item => !item.read_at).length, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = Boolean(sessionData.session?.user?.id);
      setSessionReady(hasSession);
      if (!hasSession) {
        setItems([]);
        return;
      }
      setItems(await notificationService.list(20));
    } catch (error) {
      console.warn('Could not load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const openNotification = async (item: AppNotification) => {
    if (!item.read_at) {
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
      notificationService.markRead(item.id).catch(error => console.warn('Could not mark notification read:', error));
    }
    setOpen(false);
    if (item.action_url) {
      if (/^https?:\/\//i.test(item.action_url)) window.location.href = item.action_url;
      else navigate(item.action_url);
    }
  };

  const markAll = async () => {
    const now = new Date().toISOString();
    setItems(current => current.map(item => ({ ...item, read_at: item.read_at || now })));
    notificationService.markAllRead().catch(error => console.warn('Could not mark notifications read:', error));
  };

  const buttonClass = variant === 'teacher'
    ? 'relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700'
    : 'relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700';

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(value => !value); if (!open) load(); }}
        className={buttonClass}
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Open notifications'}
      >
        {unreadCount ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">Notifications</p>
              <p className="text-[11px] font-semibold text-slate-500">New notes, papers and class posts</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[22rem] overflow-y-auto p-2">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading updates
              </div>
            ) : !sessionReady ? (
              <div className="p-5 text-center">
                <p className="text-sm font-black text-slate-800">Sign in to see your updates.</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Learners and teachers get new paper and notes alerts here.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm font-black text-slate-800">No updates yet.</p>
                <p className="mt-1 text-xs font-medium text-slate-500">When admin publishes papers or notes, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50"
                  >
                    <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${item.read_at ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                        {typeLabel(item.item_type)} <span className="text-slate-300">&bull;</span> {formatTime(item.created_at)}
                      </span>
                      <span className="mt-1 block text-sm font-black leading-snug text-slate-900">{item.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs font-medium leading-relaxed text-slate-500">{item.body}</span>
                    </span>
                    {item.action_url && <ChevronRight className="mt-5 h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {sessionReady && items.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <button type="button" onClick={markAll} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-indigo-700">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
              <button type="button" onClick={load} className="text-xs font-black text-indigo-600 hover:text-indigo-800">
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

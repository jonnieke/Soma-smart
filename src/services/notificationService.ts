import { supabase } from '../lib/supabase';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  item_type: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export const notificationService = {
  async list(limit = 20) {
    const { data, error } = await supabase.rpc('get_my_notifications', { p_limit: limit });
    if (error) throw error;
    return (data || []) as AppNotification[];
  },

  async markRead(id: string) {
    const { error } = await supabase.rpc('mark_notification_read', { p_notification_id: id });
    if (error) throw error;
  },

  async markAllRead() {
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) throw error;
  },
};

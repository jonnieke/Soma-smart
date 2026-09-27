import { supabase } from '../lib/supabase';

export const CONSENT_VERSION = 'customer-updates-v1';
export interface CommunicationPreferences { inApp: boolean; email: boolean; whatsapp: boolean }
export const defaultPreferences: CommunicationPreferences = { inApp: true, email: false, whatsapp: false };

export const communicationPreferencesService = {
  async load(): Promise<CommunicationPreferences> {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error('Sign in with your account to manage updates. Student-ID-only and guest purchases are not enrolled automatically.');
    const { data, error } = await supabase.from('notification_preferences')
      .select('in_app_enabled,email_enabled,whatsapp_enabled,consent_version,content_updates_enabled')
      .eq('user_id', auth.user.id).maybeSingle();
    if (error) throw new Error('Communication preferences are unavailable. Please try again later.');
    if (!data || data.consent_version !== CONSENT_VERSION) return { ...defaultPreferences };
    return { inApp: data.content_updates_enabled && data.in_app_enabled,
      email: data.content_updates_enabled && data.email_enabled,
      whatsapp: data.content_updates_enabled && data.whatsapp_enabled };
  },
  async save(preferences: CommunicationPreferences) {
    const { error } = await supabase.rpc('save_my_communication_preferences', {
      p_in_app: preferences.inApp, p_email: preferences.email, p_whatsapp: preferences.whatsapp,
    });
    if (error) throw new Error('Your preferences could not be saved. Please retry; no success has been recorded.');
  },
};

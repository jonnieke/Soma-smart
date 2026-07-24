import { SchoolActivityLog, AuditActionType } from '../types/schoolWorkspace';
import { supabase } from '../lib/supabase';

const AUDIT_LOGS_STORAGE_KEY = 'soma_school_activity_logs';

export const schoolAuditService = {
  /**
   * Logs a new school activity/audit event
   */
  async logEvent(params: {
    schoolId: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    action: AuditActionType;
    targetType: 'paper' | 'question' | 'teacher' | 'department' | 'template' | 'credits' | 'settings' | 'subscription';

    targetId: string;
    targetTitle?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<SchoolActivityLog> {
    const newLog: SchoolActivityLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      targetTitle: params.targetTitle,
      reason: params.reason,
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Save to local storage cache
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      const existing: SchoolActivityLog[] = raw ? JSON.parse(raw) : [];
      existing.unshift(newLog);
      // Keep recent 200 logs locally
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(existing.slice(0, 200)));
    } catch (_) {}

    // Async sync to Supabase
    try {
      void supabase.from('school_activity_logs').insert({
        id: newLog.id,
        school_id: newLog.schoolId,
        actor_id: newLog.actorId,
        actor_name: newLog.actorName,
        actor_role: newLog.actorRole,
        action: newLog.action,
        target_type: newLog.targetType,
        target_id: newLog.targetId,
        target_title: newLog.targetTitle,
        reason: newLog.reason,
        metadata: newLog.metadata,
        timestamp: newLog.timestamp,
      });
    } catch (_) {}

    return newLog;
  },

  /**
   * Fetches audit activity logs for a school
   */
  async getAuditLogs(schoolId: string): Promise<SchoolActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('school_activity_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          schoolId: d.school_id,
          actorId: d.actor_id,
          actorName: d.actor_name,
          actorRole: d.actor_role,
          action: d.action as AuditActionType,
          targetType: d.target_type,
          targetId: d.target_id,
          targetTitle: d.target_title,
          reason: d.reason,
          metadata: d.metadata,
          timestamp: d.timestamp,
        }));
      }
    } catch (_) {}

    // Fallback to local storage
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (raw) {
        const parsed: SchoolActivityLog[] = JSON.parse(raw);
        return parsed.filter((l) => l.schoolId === schoolId);
      }
    } catch (_) {}

    return [];
  },
};

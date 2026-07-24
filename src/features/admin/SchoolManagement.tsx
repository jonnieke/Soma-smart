import React, { useEffect, useState } from 'react';
import { School, Users, ShieldAlert, Zap, History, Lock, Unlock, Plus } from 'lucide-react';
import { schoolWorkspaceService } from '../../services/schoolWorkspaceService';
import { schoolCreditService } from '../../services/schoolCreditService';
import { schoolAuditService } from '../../services/schoolAuditService';
import { SchoolCreditAllocation, SchoolActivityLog, SchoolMembership } from '../../types/schoolWorkspace';

export const SchoolManagement: React.FC = () => {
  const [allocation, setAllocation] = useState<SchoolCreditAllocation | null>(null);
  const [members, setMembers] = useState<SchoolMembership[]>([]);
  const [logs, setLogs] = useState<SchoolActivityLog[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const alloc = await schoolCreditService.getSchoolCreditAllocation('default_school');
    setAllocation(alloc);

    const mems = await schoolWorkspaceService.getMemberships('default_school');
    setMembers(mems);

    const auditLogs = await schoolAuditService.getAuditLogs('default_school');
    setLogs(auditLogs.slice(0, 10));
  };

  const handleAdjustCredits = async () => {
    if (!allocation) return;
    const input = prompt('Enter new total allocated AI credits for school:', allocation.totalAllocatedCredits.toString());
    if (!input) return;
    const val = parseInt(input, 10);
    if (isNaN(val)) return;

    const updated = await schoolCreditService.updateSchoolCredits('default_school', {
      totalAllocatedCredits: val,
      remainingCredits: Math.max(0, val - allocation.usedCredits),
    });
    setAllocation(updated);

    await schoolAuditService.logEvent({
      schoolId: 'default_school',
      actorId: 'admin_sys',
      actorName: 'Platform Administrator',
      actorRole: 'SUPER_ADMIN',
      action: 'CREDITS_ALLOCATED',
      targetType: 'credits',
      targetId: 'default_school',
      reason: `Platform admin adjusted total credits to ${val}`,
    });

    await loadAdminData();
  };

  if (!allocation) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <School className="w-5 h-5 text-indigo-600" />
          Platform Admin - School Workspace Management
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Monitor school memberships, adjust shared AI credit balances, and review workspace audit events.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Total School Members</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{members.length} Teachers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span>Remaining AI Credits</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {allocation.remainingCredits.toLocaleString()} / {allocation.totalAllocatedCredits.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400">Manage Allocation</div>
            <div className="text-xs text-slate-500 mt-1">Adjust credit limits for school</div>
          </div>
          <button
            onClick={handleAdjustCredits}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            Adjust Credits
          </button>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          Recent Platform Audit Events
        </h3>

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between">
              <div>
                <span className="font-bold text-indigo-600 mr-2">[{log.action}]</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{log.targetTitle || log.targetId}</span>
                <span className="text-slate-400 ml-2">by {log.actorName}</span>
              </div>
              <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

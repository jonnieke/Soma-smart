import React, { useEffect, useState } from 'react';
import { Zap, Users, FolderPlus, AlertCircle, ShieldAlert, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';
import { SchoolCreditAllocation, SchoolMembership } from '../../../types/schoolWorkspace';
import { schoolCreditService } from '../../../services/schoolCreditService';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';

export const SchoolUsageView: React.FC = () => {
  const [allocation, setAllocation] = useState<SchoolCreditAllocation | null>(null);
  const [members, setMembers] = useState<SchoolMembership[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const alloc = await schoolCreditService.getSchoolCreditAllocation('default_school');
    setAllocation(alloc);

    const mems = await schoolWorkspaceService.getMemberships();
    setMembers(mems);
  };

  const handleToggleUserSuspension = async (userId: string) => {
    if (!allocation) return;
    const currentSuspended = allocation.suspendedUserIds || [];
    const isSuspended = currentSuspended.includes(userId);

    const nextSuspended = isSuspended
      ? currentSuspended.filter((id) => id !== userId)
      : [...currentSuspended, userId];

    const updated = await schoolCreditService.updateSchoolCredits('default_school', {
      suspendedUserIds: nextSuspended,
    });
    setAllocation(updated);
  };

  const handleSetUserLimit = async (userId: string) => {
    if (!allocation) return;
    const current = allocation.userLimits?.[userId] || 500;
    const input = prompt('Enter maximum AI credits limit for this teacher:', current.toString());
    if (input === null) return;
    const val = parseInt(input, 10);
    if (isNaN(val)) return;

    const updated = await schoolCreditService.updateSchoolCredits('default_school', {
      userLimits: { ...allocation.userLimits, [userId]: val },
    });
    setAllocation(updated);
  };

  if (!allocation) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-600" />
          School AI Credits &amp; Resource Allocation
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Centralized AI credit limits, department usage analytics, and teacher quota controls.
        </p>
      </div>

      {/* Credit Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl space-y-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Total Allocated</span>
          <div className="text-3xl font-black">{allocation.totalAllocatedCredits.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-200">Term 1 Shared Balance</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Used This Term</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{allocation.usedCredits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 font-medium">Across all departments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Remaining Balance</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{allocation.remainingCredits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 font-medium">Available for generation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Question Reuse Rate</span>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">84%</div>
          <div className="text-[11px] text-emerald-600 font-bold">Saved ~KES 45,000 AI costs</div>
        </div>
      </div>

      {/* Teacher Credit Quotas Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Per-Teacher Credit Limits &amp; AI Status
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-400">
                <th className="py-3 px-4">Teacher Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">AI Access Status</th>
                <th className="py-3 px-4 text-right">Quota Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {members.map((mem) => {
                const isSuspended = allocation.suspendedUserIds?.includes(mem.userId);
                const limit = allocation.userLimits?.[mem.userId] ?? 'Unlimited';

                return (
                  <tr key={mem.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {mem.userName}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {mem.roles[0]}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {typeof limit === 'number' ? `${limit} Credits` : limit}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isSuspended ? 'AI Suspended' : 'Active'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSetUserLimit(mem.userId)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                      >
                        Set Limit
                      </button>

                      <button
                        onClick={() => handleToggleUserSuspension(mem.userId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white ${
                          isSuspended ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {isSuspended ? 'Reactivate AI' : 'Suspend AI'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

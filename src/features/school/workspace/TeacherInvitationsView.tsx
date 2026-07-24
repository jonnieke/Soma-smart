import React, { useEffect, useState } from 'react';
import { UserPlus, Users, Shield, Mail, CheckCircle2, Clock, X, Copy, Ban, RefreshCw } from 'lucide-react';
import { SchoolMembership, SchoolInvitation, SchoolRole, SchoolDepartment } from '../../../types/schoolWorkspace';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';

export const TeacherInvitationsView: React.FC = () => {
  const [members, setMembers] = useState<SchoolMembership[]>([]);
  const [invitations, setInvitations] = useState<SchoolInvitation[]>([]);
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  // Form state
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<SchoolRole[]>(['TEACHER']);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const memList = await schoolWorkspaceService.getMemberships();
    setMembers(memList);

    const invList = await schoolWorkspaceService.getInvitations('default_school');
    setInvitations(invList);

    const deptList = await schoolWorkspaceService.getDepartments();
    setDepartments(deptList);
  };

  const handleToggleRole = (role: SchoolRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleToggleDept = (deptId: string) => {
    if (selectedDeptIds.includes(deptId)) {
      setSelectedDeptIds(selectedDeptIds.filter((d) => d !== deptId));
    } else {
      setSelectedDeptIds([...selectedDeptIds, deptId]);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeName.trim() || !inviteeEmail.trim()) return;

    const invite = await schoolWorkspaceService.createInvitation({
      schoolId: 'default_school',
      schoolName: 'Nairobi Academy High School',
      inviteeName,
      inviteeEmail,
      roles: selectedRoles.length ? selectedRoles : ['TEACHER'],
      departmentIds: selectedDeptIds,
      invitedBy: 'user_principal',
      invitedByName: 'Principal Dr. Otieno',
    });

    const inviteUrl = `${window.location.origin}/join?token=${invite.token}`;
    setGeneratedInviteLink(inviteUrl);
    await loadData();
  };

  const handleSimulateAccept = async (token: string) => {
    try {
      await schoolWorkspaceService.acceptInvitation(token, `user_accepted_${Date.now()}`, inviteeName || 'New Teacher');
      alert('Invitation accepted! Teacher membership is now ACTIVE.');
      setGeneratedInviteLink(null);
      setIsInviteModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            School Teachers &amp; Permission Roles
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage active teacher memberships, invite staff, assign HOD &amp; Coordinator privileges.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedInviteLink(null);
            setIsInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          Invite New Teacher
        </button>
      </div>

      {/* Active Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Active School Members ({members.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-400">
                <th className="py-3 px-4">Teacher Name &amp; Email</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Departments</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{mem.userName}</div>
                    <div className="text-[11px] text-slate-400">{mem.userEmail}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {mem.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-slate-600 dark:text-slate-400 font-semibold">
                      {mem.departmentIds.length ? mem.departmentIds.join(', ') : 'All Departments'}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {mem.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <button className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600">
                      Manage Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Teacher Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Invite Teacher to School</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Invitation Generated Successfully!
                  </div>
                  <p className="text-[11px]">
                    Share this one-time secure invitation link with <strong>{inviteeName}</strong>:
                  </p>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-mono text-[11px] break-all select-all">
                    {generatedInviteLink}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedInviteLink)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Copy Invitation Link
                  </button>

                  <button
                    onClick={() => handleSimulateAccept(generatedInviteLink.split('token=')[1])}
                    className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                  >
                    Simulate Accept
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Teacher Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mwalimu Grace Wanjiku"
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Teacher Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. grace@nairobiacademy.ac.ke"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Assign School Roles</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['TEACHER', 'HOD', 'EXAM_COORDINATOR', 'REVIEWER', 'ADMIN'] as SchoolRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleToggleRole(role)}
                        className={`p-2 rounded-xl border font-bold text-left transition ${
                          selectedRoles.includes(role)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                  >
                    Generate Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

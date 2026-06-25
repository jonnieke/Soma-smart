import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, MoreHorizontal, UserCheck2, School, Users, Sparkles, GraduationCap } from 'lucide-react';
import { fetchAllUsers, AdminUser } from '../../../services/adminService';
import { Button } from '../../../components/Shared';
import { useLocation, useNavigate } from 'react-router-dom';

export const UsersView: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialParams = new URLSearchParams(location.search);
    const initialRole = initialParams.get('role');
    const initialSearch = initialParams.get('q') || '';
    const [activeTab, setActiveTab] = useState<'LEARNER' | 'TEACHER' | 'PARENT'>(initialRole === 'TEACHER' || initialRole === 'PARENT' || initialRole === 'LEARNER' ? initialRole : 'LEARNER');
    const [search, setSearch] = useState(initialSearch);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const nextRole = params.get('role');
        const nextSearch = params.get('q') || '';

        if (nextRole === 'TEACHER' || nextRole === 'PARENT' || nextRole === 'LEARNER') {
            setActiveTab(nextRole);
        }
        setSearch(nextSearch);
    }, [location.search]);

    const syncUserParams = (nextTab: 'LEARNER' | 'TEACHER' | 'PARENT', nextSearch: string) => {
        const params = new URLSearchParams(location.search);
        params.set('tab', 'USERS');
        params.set('role', nextTab);
        if (nextSearch.trim()) {
            params.set('q', nextSearch.trim());
        } else {
            params.delete('q');
        }
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    };

    const counts = useMemo(() => ({
        LEARNER: users.filter(u => u.role === 'LEARNER').length,
        TEACHER: users.filter(u => u.role === 'TEACHER').length,
        PARENT: users.filter(u => u.role === 'PARENT').length,
    }), [users]);

    const filteredUsers = users.filter(u =>
        u.role === activeTab &&
        (
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
            u.id.toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Learners</p>
                            <p className="text-2xl font-black text-slate-900">{counts.LEARNER}</p>
                        </div>
                        <div className="rounded-xl bg-sky-50 p-3 text-sky-600"><GraduationCap className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Teachers</p>
                            <p className="text-2xl font-black text-slate-900">{counts.TEACHER}</p>
                        </div>
                        <div className="rounded-xl bg-violet-50 p-3 text-violet-600"><School className="h-5 w-5" /></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Parents</p>
                            <p className="text-2xl font-black text-slate-900">{counts.PARENT}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><UserCheck2 className="h-5 w-5" /></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            {(['LEARNER', 'TEACHER', 'PARENT'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); syncUserParams(tab, search); }}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === tab
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500">
                            Browse the current {activeTab.toLowerCase()} list, verify profiles, and identify who needs onboarding support.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
                                value={search}
                                onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setSearch(nextValue);
                                    syncUserParams(activeTab, nextValue);
                                }}
                            />
                        </div>
                        <Button variant="outline" className="px-3"><Filter className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                {activeTab === 'LEARNER' && <th className="px-6 py-4">Grade</th>}
                                {activeTab === 'TEACHER' && <th className="px-6 py-4">School</th>}
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-400 text-xs">{u.student_id || u.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{u.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{u.id}</div>
                                        </td>
                                        {activeTab === 'LEARNER' && <td className="px-6 py-4 text-slate-600">{u.grade || '-'}</td>}
                                        {activeTab === 'TEACHER' && <td className="px-6 py-4 text-slate-600">{u.school || '-'}</td>}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'TEACHER' ? 'bg-violet-100 text-violet-700' : u.role === 'PARENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.is_pro ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {u.is_pro ? 'Pro' : 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-indigo-600">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                The table is now clean enough to support support, onboarding, and account checks without jumping into the database.
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { fetchAllUsers, AdminUser } from '../../../services/adminService';
import { Button } from '../../../components/Shared';

export const UsersView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'LEARNER' | 'TEACHER' | 'PARENT'>('LEARNER');
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchAllUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    const filteredUsers = users.filter(u =>
        u.role === activeTab &&
        (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
            u.id.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    {['LEARNER', 'TEACHER', 'PARENT'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="px-3"><Filter className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Name</th>
                            {activeTab === 'LEARNER' && <th className="px-6 py-4">Grade</th>}
                            {activeTab === 'TEACHER' && <th className="px-6 py-4">Schools/Subs</th>}
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No users found.</td></tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">{u.student_id || u.id.slice(0, 8)}</td>
                                    <div className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{u.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-400">{u.is_pro ? 'PRO MEMBER' : 'Free Tier'}</div>
                                    </div>
                                    {activeTab === 'LEARNER' && <td className="px-6 py-4 text-slate-600">{u.grade || '-'}</td>}
                                    {activeTab === 'TEACHER' && <td className="px-6 py-4 text-slate-600">{u.school || '-'}</td>}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'TEACHER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
        {active ? 'Active' : 'Inactive'}
    </span>
);

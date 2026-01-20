import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/Shared';

export const UsersView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'STUDENTS' | 'TEACHERS' | 'PARENTS'>('STUDENTS');
    const [search, setSearch] = useState("");

    // Mock Data
    const students = Array(10).fill(0).map((_, i) => ({
        id: `ST-${100 + i}`,
        name: `Student ${i + 1}`,
        grade: `Grade ${4 + (i % 4)}`,
        status: i % 5 === 0 ? 'Inactive' : 'Active',
        joined: '2025-01-15'
    }));

    const teachers = Array(8).fill(0).map((_, i) => ({
        id: `TC-${500 + i}`,
        name: `Teacher ${i + 1}`,
        school: `Academy ${String.fromCharCode(65 + i)}`,
        verified: i % 3 !== 0,
        contentCount: i * 15
    }));

    const parents = Array(5).fill(0).map((_, i) => ({
        id: `PR-${900 + i}`,
        name: `Parent ${i + 1}`,
        children: i + 1,
        plan: i % 2 === 0 ? 'Free' : 'Pro'
    }));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    {['STUDENTS', 'TEACHERS', 'PARENTS'].map((tab) => (
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
                            {activeTab === 'STUDENTS' && <th className="px-6 py-4">Grade</th>}
                            {activeTab === 'TEACHERS' && <th className="px-6 py-4">School</th>}
                            {activeTab === 'TEACHERS' && <th className="px-6 py-4">Content</th>}
                            {activeTab === 'PARENTS' && <th className="px-6 py-4">Children</th>}
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {activeTab === 'STUDENTS' && students.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">{s.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-700">{s.name}</td>
                                <td className="px-6 py-4 text-slate-600">{s.grade}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge active={s.status === 'Active'} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}

                        {activeTab === 'TEACHERS' && teachers.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">{t.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-700">{t.name}</td>
                                <td className="px-6 py-4 text-slate-600">{t.school}</td>
                                <td className="px-6 py-4 font-mono text-indigo-600">{t.contentCount} items</td>
                                <td className="px-6 py-4">
                                    {t.verified ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Verified</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Pending</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}

                        {activeTab === 'PARENTS' && parents.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-400">{p.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                                <td className="px-6 py-4 text-slate-600">{p.children} Linked</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.plan === 'Pro' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {p.plan} Plan
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
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

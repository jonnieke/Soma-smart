import React, { useEffect, useState } from 'react';
import { getTransactions, Transaction } from '../../../services/paymentService';
import { DollarSign, CreditCard, TrendingUp, Download, Calendar } from 'lucide-react';
import { fetchDashboardStats } from '../../../services/adminService';
import { Button } from '../../../components/Shared';

export const FinancialsView: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [revenue, setRevenue] = useState(0);

    React.useEffect(() => {
        getTransactions().then(setTransactions);
        fetchDashboardStats().then(stats => setRevenue(stats.totalRevenue));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Financial Records</h2>
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20"></div>
                    <p className="text-slate-400 text-xs font-medium mb-1">Total Revenue</p>
                    <h2 className="text-2xl font-black mb-1">KES {revenue.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium mb-1">Students</p>
                    <h2 className="text-2xl font-black text-slate-800">KES {(revenue * 0.6).toLocaleString()}</h2>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium mb-1">Teachers</p>
                    <h2 className="text-2xl font-black text-slate-800">KES {(revenue * 0.3).toLocaleString()}</h2>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-slate-500 text-xs font-medium mb-1">Schools</p>
                    <h2 className="text-2xl font-black text-slate-800">KES {(revenue * 0.1).toLocaleString()}</h2>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400">{t.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{t.user}</td>
                                    <td className="px-6 py-4 font-mono">KES {t.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{t.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { getTransactions, Transaction } from '../../../services/paymentService';
import { Download, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/Shared';

export const FinancialsView: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        getTransactions().then(setTransactions);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Financial Records</h2>
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400">#{tx.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{tx.user}</td>
                                    <td className="px-6 py-4 text-slate-600">{tx.type}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {tx.method === 'MPESA' ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            {tx.method}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-800">KES {tx.amount}</td>
                                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Success
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

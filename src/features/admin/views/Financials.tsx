import React, { useEffect, useState } from 'react';
import { getTransactions, Transaction } from '../../../services/paymentService';
import { AlertTriangle, Bot, Download, LineChart, Wallet } from 'lucide-react';
import { fetchDashboardStats, fetchFinanceSummary, FinanceSummary } from '../../../services/adminService';
import { Button } from '../../../components/Shared';

export const FinancialsView: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [finance, setFinance] = useState<FinanceSummary | null>(null);

    React.useEffect(() => {
        getTransactions().then(setTransactions);
        fetchDashboardStats().then(stats => setRevenue(stats.totalRevenue));
        fetchFinanceSummary().then(setFinance);
    }, []);

    const totalRevenue = finance?.totalRevenueKes ?? revenue;
    const aiCost = finance?.aiCostKes ?? 0;
    const margin = finance?.grossMarginKes ?? totalRevenue;
    const marginPct = finance?.grossMarginPct ?? (totalRevenue > 0 ? 100 : 0);
    const marginRisk = totalRevenue > 0 && marginPct < 50;

    const exportCsv = () => {
        const rows = [
            ['Transaction ID', 'User', 'Type', 'Method', 'Amount (KES)', 'Status', 'Date'],
            ...transactions.map((t) => [
                t.id,
                t.user,
                t.type,
                t.method,
                String(t.amount),
                t.status,
                t.date
            ])
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `soma-financials-${new Date().toISOString().slice(0, 10)}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Financial Records</h2>
                    <p className="text-sm text-slate-500 font-medium">30-day revenue, estimated AI overhead, and gross margin signals.</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={transactions.length === 0}>
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20"></div>
                    <Wallet className="w-5 h-5 text-emerald-300 mb-3" />
                    <p className="text-slate-400 text-xs font-medium mb-1">30-Day Revenue</p>
                    <h2 className="text-2xl font-black mb-1">KES {totalRevenue.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <Bot className="w-5 h-5 text-indigo-500 mb-3" />
                    <p className="text-slate-500 text-xs font-medium mb-1">Estimated AI Cost</p>
                    <h2 className="text-2xl font-black text-slate-800">KES {aiCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">{finance?.aiCalls || 0} tracked calls</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <LineChart className="w-5 h-5 text-emerald-500 mb-3" />
                    <p className="text-slate-500 text-xs font-medium mb-1">Gross Margin</p>
                    <h2 className={`text-2xl font-black ${marginRisk ? 'text-rose-600' : 'text-slate-800'}`}>KES {margin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
                    <p className={`text-[11px] mt-1 font-bold ${marginRisk ? 'text-rose-500' : 'text-emerald-600'}`}>{marginPct.toFixed(1)}% margin</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <AlertTriangle className={`w-5 h-5 mb-3 ${marginRisk ? 'text-rose-500' : 'text-amber-500'}`} />
                    <p className="text-slate-500 text-xs font-medium mb-1">Avg AI Cost / Call</p>
                    <h2 className="text-2xl font-black text-slate-800">KES {(finance?.avgAiCostPerCallKes || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">Cap costly features if this rises</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="font-black text-slate-800">Highest AI Cost Features</h3>
                        <p className="text-xs text-slate-500 mt-1">Use this to decide plan limits, caching, and premium gates.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Feature</th>
                                    <th className="px-6 py-3">Calls</th>
                                    <th className="px-6 py-3">Input Tokens</th>
                                    <th className="px-6 py-3">Output Tokens</th>
                                    <th className="px-6 py-3">Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(finance?.topFeatures || []).map(feature => (
                                    <tr key={feature.feature} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3 font-bold text-slate-700 capitalize">{feature.feature.replace(/_/g, ' ')}</td>
                                        <td className="px-6 py-3 font-mono">{feature.calls}</td>
                                        <td className="px-6 py-3 font-mono text-slate-500">{feature.inputTokens.toLocaleString()}</td>
                                        <td className="px-6 py-3 font-mono text-slate-500">{feature.outputTokens.toLocaleString()}</td>
                                        <td className="px-6 py-3 font-black text-slate-800">KES {feature.estimatedCostKes.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {(!finance?.topFeatures || finance.topFeatures.length === 0) && (
                                    <tr>
                                        <td className="px-6 py-8 text-center text-slate-400 font-medium" colSpan={5}>
                                            No AI cost events yet. New events appear after learners use AI features.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="font-black text-amber-900 mb-3">Business Guardrails</h3>
                    <div className="space-y-3 text-sm text-amber-900">
                        <p><strong>Daily plan:</strong> keep high-cost actions capped. Marking and voice should never be unlimited at KES 20.</p>
                        <p><strong>Cache:</strong> common past paper explanations and drills should be reused before generating again.</p>
                        <p><strong>Watch:</strong> if AI cost exceeds 25-35% of revenue, tighten free limits or move the feature to weekly/monthly plans.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-800">Recent Transactions</h3>
                </div>
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

import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, ShieldCheck, Database, Info, CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type PesapalTestResult = {
    success: boolean;
    is_sandbox?: boolean;
    key_present?: boolean;
    secret_present?: boolean;
    ipn_present?: boolean;
    error?: string;
};

export const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState<Array<{ key: string; value: string; description?: string | null; created_at?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [pesapalTesting, setPesapalTesting] = useState(false);
    const [pesapalResult, setPesapalResult] = useState<PesapalTestResult | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('key, value, description, created_at')
                .order('key', { ascending: true });

            if (!mounted) return;
            if (!error && data) setSettings(data as any);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const promoEndDate = useMemo(() => {
        const promo = settings.find((item) => item.key === 'promo_end_date');
        if (!promo?.value) return null;
        const parsed = new Date(promo.value);
        return Number.isNaN(parsed.getTime()) ? promo.value : parsed.toLocaleString();
    }, [settings]);

    const testPesapal = async () => {
        setPesapalTesting(true);
        setPesapalResult(null);
        try {
            const { data, error } = await supabase.functions.invoke('pesapal/test-keys');
            if (error) throw error;
            setPesapalResult(data as PesapalTestResult);
        } catch (e: any) {
            setPesapalResult({ success: false, error: e.message || 'Request failed' });
        } finally {
            setPesapalTesting(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            {/* Pesapal Connection Test */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-800">Pesapal Payment Gateway</h3>
                    </div>
                    <button
                        onClick={testPesapal}
                        disabled={pesapalTesting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                    >
                        {pesapalTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        {pesapalTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                </div>

                {pesapalResult && (
                    <div className={`rounded-xl border p-5 flex items-start gap-4 ${pesapalResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        {pesapalResult.success
                            ? <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                            : <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />}
                        <div className="space-y-1 text-sm">
                            <p className={`font-black ${pesapalResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                                {pesapalResult.success ? 'Connected successfully' : 'Connection failed'}
                            </p>
                            {pesapalResult.success && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${pesapalResult.is_sandbox ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {pesapalResult.is_sandbox ? 'SANDBOX mode' : 'LIVE mode'}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${pesapalResult.key_present ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                        Key: {pesapalResult.key_present ? 'Set' : 'Missing'}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${pesapalResult.secret_present ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                        Secret: {pesapalResult.secret_present ? 'Set' : 'Missing'}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${pesapalResult.ipn_present ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'}`}>
                                        IPN ID: {pesapalResult.ipn_present ? 'Set' : 'Missing — register IPN first'}
                                    </span>
                                </div>
                            )}
                            {pesapalResult.error && <p className="text-red-700 font-semibold mt-1">{pesapalResult.error}</p>}
                            {pesapalResult.success && pesapalResult.is_sandbox && (
                                <p className="text-amber-700 font-semibold mt-2">
                                    You are in SANDBOX mode. Set PESAPAL_IS_SANDBOX=false in Supabase secrets to accept real payments.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {!pesapalResult && (
                    <p className="text-sm text-slate-400 font-medium">
                        Click "Test Connection" to verify your Pesapal keys and check whether you are in sandbox or live mode.
                    </p>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6">System Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <Clock3 className="w-5 h-5 text-indigo-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Promo Window</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{loading ? 'Loading...' : (promoEndDate || 'No promo date stored')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Maintenance Mode</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">Not configured yet</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <Database className="w-5 h-5 text-sky-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Config Source</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">system_settings table</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-800">Stored Settings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Key</th>
                                <th className="px-4 py-3">Value</th>
                                <th className="px-4 py-3">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {settings.map((setting) => (
                                <tr key={setting.key} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-mono text-slate-700">{setting.key}</td>
                                    <td className="px-4 py-3 text-slate-800 break-all">{setting.value}</td>
                                    <td className="px-4 py-3 text-slate-500">{setting.description || '—'}</td>
                                </tr>
                            ))}
                            {!loading && settings.length === 0 && (
                                <tr>
                                    <td className="px-4 py-8 text-center text-slate-400" colSpan={3}>
                                        No system settings found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, ShieldCheck, Database, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export const SettingsView: React.FC = () => {
    const [settings, setSettings] = useState<Array<{ key: string; value: string; description?: string | null; created_at?: string }>>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="max-w-4xl space-y-8">
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

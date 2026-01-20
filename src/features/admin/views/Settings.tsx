import React from 'react';
import { ToggleLeft, Save } from 'lucide-react';
import { Button } from '../../../components/Shared';

export const SettingsView: React.FC = () => {
    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6">System Configuration</h3>

                <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-slate-50">
                        <div>
                            <h4 className="font-bold text-slate-700">Maintenance Mode</h4>
                            <p className="text-sm text-slate-400">Suspend all non-admin access.</p>
                        </div>
                        <ToggleLeft className="w-10 h-10 text-slate-300 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-50">
                        <div>
                            <h4 className="font-bold text-slate-700">AI Model</h4>
                            <p className="text-sm text-slate-400">Current: gemini-1.5-flash (Google)</p>
                        </div>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                            <option>gemini-1.5-flash</option>
                            <option>gemini-pro</option>
                            <option>gpt-4o (Disabled)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <div>
                            <h4 className="font-bold text-slate-700">Debug Logging</h4>
                            <p className="text-sm text-slate-400">Verbose API response logging.</p>
                        </div>
                        <ToggleLeft className="w-10 h-10 text-indigo-500 cursor-pointer" />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button className="gap-2"><Save className="w-4 h-4" /> Save Changes</Button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-sm p-8 text-slate-300 font-mono text-sm">
                <h3 className="text-white font-bold mb-4">System Logs</h3>
                <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar">
                    <p><span className="text-emerald-400">[INFO]</span> 10:42:01 - System Init Complete.</p>
                    <p><span className="text-blue-400">[API]</span> 10:42:02 - Connected to Supabase.</p>
                    <p><span className="text-blue-400">[API]</span> 10:44:15 - GET /api/stats (200 OK)</p>
                    <p><span className="text-yellow-400">[WARN]</span> 10:45:30 - High latency detecting on OpenAI fallback.</p>
                    <p><span className="text-blue-400">[API]</span> 10:50:01 - Payment Webhook Received (TX-9920).</p>
                </div>
            </div>
        </div>
    );
};

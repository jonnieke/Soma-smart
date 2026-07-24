import React, { useState } from 'react';
import { Code, Key, Webhook, BookOpen, Copy, Plus, CheckCircle2, Shield } from 'lucide-react';
import { apiPlatformService } from '../../services/apiPlatformService';

export const DeveloperPortalView: React.FC = () => {
  const [apps] = useState(apiPlatformService.getApplications());
  const [webhooks] = useState(apiPlatformService.getWebhooks());
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    const app = apiPlatformService.createApplication({
      tenantId: 'tenant_school_001',
      name: appName,
      description: appDescription,
      ownerUserId: 'usr_dev_001',
      allowedScopes: ['schools.read', 'results.read', 'assessments.read'],
    });

    const { rawKey } = apiPlatformService.generateApiKey(app.id, `${appName} Primary Key`, app.allowedScopes);
    setGeneratedKey(rawKey);
    setAppName('');
    setAppDescription('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Code className="w-6 h-6 text-indigo-600" /> Soma Developer Portal &amp; Integration Platform
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage API applications, secure hashed credentials, rate limit policies, and signed webhook subscriptions.</p>
      </div>

      {/* App Creation Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" /> Register New API Application
        </h3>

        <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Application Name</label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. School SIS Sync Bot"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Automated results sync with school portal"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Key className="w-4 h-4" /> Create Application &amp; Generate API Key
          </button>
        </form>

        {generatedKey && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-2 text-xs">
            <p className="font-black text-emerald-900 dark:text-emerald-300">API Secret Key Generated (Shown Once Only)</p>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl font-mono text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              {generatedKey}
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400">Copy and store this API key securely. In production, only the SHA-256 hash is stored on Soma servers.</p>
          </div>
        )}
      </div>

      {/* Existing Applications & Webhooks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" /> Active API Applications ({apps.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {apps.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{a.name}</p>
                  <p className="text-slate-500">Scopes: {a.allowedScopes.join(', ')}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Webhook className="w-4 h-4 text-violet-600" /> Webhook Subscriptions ({webhooks.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {webhooks.map((wh) => (
              <div key={wh.id} className="py-3">
                <p className="font-bold text-slate-900 dark:text-white truncate">{wh.targetUrl}</p>
                <p className="text-slate-500">Events: {wh.eventTypes.join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

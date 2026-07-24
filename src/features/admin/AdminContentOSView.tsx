import React, { useState } from 'react';
import { Shield, Layers, Upload, Database, CheckCircle } from 'lucide-react';
import { curriculumOSService } from '../../services/curriculumOSService';

export const AdminContentOSView: React.FC = () => {
  const [frameworks] = useState(curriculumOSService.getFrameworks());
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImport = () => {
    const res = curriculumOSService.importCurriculumFramework(importJson);
    if (res.success) {
      setImportStatus(`Successfully imported ${res.importedNodesCount} curriculum nodes into framework ${res.frameworkId}`);
    } else {
      setImportStatus('Failed to parse curriculum JSON payload.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Admin Content OS &amp; Curriculum Framework Manager
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage versioned KICD curriculum frameworks, CSV/JSON node importers, and editorial rights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Active Curriculum Frameworks</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {frameworks.map((fw) => (
              <div key={fw.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{fw.name}</p>
                  <p className="text-slate-500">{fw.authority} · {fw.version}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md uppercase">{fw.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" /> Curriculum Framework Importer
          </h3>
          <p className="text-xs text-slate-500">Paste JSON curriculum payload to import nodes with automated hierarchy validation.</p>

          <textarea
            rows={4}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{"frameworkId": "fw_kicd_cbc", "nodes": [...]}'
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-mono text-slate-900 dark:text-white"
          />

          {importStatus && <p className="text-xs font-bold text-indigo-600">{importStatus}</p>}

          <button
            onClick={handleImport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Import Curriculum JSON
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Shield, Upload } from 'lucide-react';
import { CurriculumSources } from '../../components/CurriculumSources';
import { CurriculumReviewQueue } from '../../components/CurriculumReviewQueue';
import { curriculumOSService } from '../../services/curriculumOSService';

export const AdminContentOSView: React.FC = () => {
  const [frameworks] = useState(curriculumOSService.getFrameworks());
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImport = () => {
    const res = curriculumOSService.importCurriculumFramework(importJson);
    if (res.success) {
      setImportStatus(`Saved ${res.importedNodesCount} draft nodes in this browser only. Not published or teacher-reviewed.`);
    } else {
      setImportStatus(res.error || 'Import failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Admin Content OS &amp; Curriculum Framework Manager
        </h1>
        <p className="text-xs text-slate-500 mt-1">Stage source-linked mappings for review. Local drafts are not shared across devices.</p>
      </div>

      <CurriculumSources />
      <CurriculumReviewQueue />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Curriculum Registry</h3>
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
          <p className="text-xs text-slate-500">JSON requires frameworkId, sourceId, and nodes with id, type, title, sourcePageNumber and optional parentId. Include the complete hierarchy. Imports remain unreviewed drafts.</p>
          <p className="text-xs break-all">Source IDs: {curriculumOSService.getSources().map(s => s.id).join(', ')}</p>

          <textarea
            aria-label="Curriculum JSON draft"
            rows={4}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{"frameworkId": "fw_kicd_cbc", "nodes": [...]}'
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-mono text-slate-900 dark:text-white"
          />

          {importStatus && <p role="status" className="text-xs font-bold text-indigo-600">{importStatus}</p>}

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

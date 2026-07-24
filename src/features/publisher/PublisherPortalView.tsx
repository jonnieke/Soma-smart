import React, { useState } from 'react';
import { Building, BookOpen, Shield, Award, CheckCircle } from 'lucide-react';
import { publisherPortalService } from '../../services/publisherPortalService';

export const PublisherPortalView: React.FC = () => {
  const [publishers, setPublishers] = useState(publisherPortalService.getPublishers());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-600" /> Soma Publisher &amp; Partner Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Institutional publishing partners, digital catalogue submissions, and rights management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {publishers.map((pub) => (
          <div key={pub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">{pub.status}</span>
              <span className="text-xs text-slate-400">{pub.country}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{pub.name}</h3>
            <p className="text-xs text-slate-500">{pub.contactEmail}</p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              {pub.submittedCataloguesCount} Approved Digital Catalogues
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

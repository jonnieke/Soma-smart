import React, { useState } from 'react';
import { Building, BookOpen, Shield, Award, CheckCircle, Plus, Upload, DollarSign, BarChart2, Sparkles } from 'lucide-react';
import { publisherPortalService } from '../../services/publisherPortalService';

export const PublisherPortalView: React.FC = () => {
  const [publishers, setPublishers] = useState(publisherPortalService.getPublishers());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 9 (Junior Secondary)');
  const [newSubject, setNewSubject] = useState('Integrated Science');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowSubmitModal(false);
      setNewTitle('');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" /> Soma Publisher &amp; Content Licensing Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">Institutional publishing partners, digital catalogue licensing, KICD compliance audits, and distribution royalties.</p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Submit Curriculum Catalogue
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Distribution Royalty</p>
          <p className="text-2xl font-black text-emerald-600">KES 485,200</p>
          <p className="text-[11px] text-slate-500 font-medium">Earned across 32,400 student readers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Licensed Catalogues</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">128 Titles</p>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 100% KICD Syllabus Verified
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Institutional Reach</p>
          <p className="text-2xl font-black text-indigo-600">450+ Schools</p>
          <p className="text-[11px] text-slate-500 font-medium">Active in Kenyan classrooms</p>
        </div>
      </div>

      {/* Partner Publishers */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Partner Publishing Houses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishers.map((pub) => (
            <div key={pub.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-full uppercase">
                  {pub.status} Partner
                </span>
                <span className="text-xs text-slate-400 font-medium">{pub.country}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{pub.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{pub.contactEmail}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-500" /> {pub.submittedCataloguesCount} Approved Titles</span>
                <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View Distribution Report →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Catalogue Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit Curriculum Catalogue</h3>
              <p className="text-xs text-slate-500 mt-1">Submit official textbooks, revision notes, or past papers for KICD compliance verification.</p>
            </div>

            <form onSubmit={handleSubmitCatalog} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Catalogue Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Spotlight KCSE Mathematics Core Guide"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Grade / Level</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="Grade 9 (Junior Secondary)">Grade 9 (JSS)</option>
                    <option value="Grade 8 (Junior Secondary)">Grade 8 (JSS)</option>
                    <option value="Grade 7 (Junior Secondary)">Grade 7 (JSS)</option>
                    <option value="Form 4 (KCSE Senior)">Form 4 (KCSE)</option>
                    <option value="Form 3 (KCSE Senior)">Form 3 (KCSE)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Chemistry"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>
              </div>

              {submitSuccess && (
                <p className="text-xs font-bold text-emerald-600 text-center flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Catalogue submitted for KICD compliance review!
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitSuccess}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Submit Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

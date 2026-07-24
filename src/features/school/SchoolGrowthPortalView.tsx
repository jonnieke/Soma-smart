import React, { useState } from 'react';
import { Building2, Calendar, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Send } from 'lucide-react';
import { schoolSalesCRMService } from '../../services/schoolSalesCRMService';

export const SchoolGrowthPortalView: React.FC = () => {
  const [schoolName, setSchoolName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(10);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleRequestDemo = (e: React.FormEvent) => {
    e.preventDefault();
    const demo = schoolSalesCRMService.scheduleDemo({
      leadId: `lead_${Date.now()}`,
      schoolName,
      contactName,
      contactEmail,
      preferredDate,
      attendeesCount,
    });
    setStatusMsg(`Demonstration request for ${demo.schoolName} submitted! A SomaAI School Success Specialist will contact you.`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> School Trial, Demo &amp; Growth Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Book school demonstrations, manage 30-day school starter trials, and track pilot performance.</p>
      </div>

      {/* Demo Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" /> Book a Live School Demonstration
        </h3>

        <form onSubmit={handleRequestDemo} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">School Name</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Alliance High School"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person &amp; Role</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Principal Kamau"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="principal@school.co.ke"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Demo Date</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {statusMsg && <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl">{statusMsg}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Request School Demonstration
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  BookOpen,
  CheckCircle,
  CreditCard,
  Layers,
  Sparkles,
  HelpCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
  Upload,
} from 'lucide-react';
import { tenantService } from '../../services/tenantService';
import { academicCalendarService } from '../../services/academicCalendarService';
import { peopleManagementService } from '../../services/peopleManagementService';
import { schoolBillingService } from '../../services/schoolBillingService';
import {
  Tenant,
  SchoolOnboardingChecklist,
  AcademicClass,
  AcademicYear,
  TeacherAllocation,
  SchoolInvoice,
} from '../../types/schoolOS';

export const SchoolOSDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SETUP' | 'CLASSES' | 'CALENDAR' | 'PEOPLE' | 'BILLING'>('SETUP');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [checklist, setChecklist] = useState<SchoolOnboardingChecklist | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [allocations, setAllocations] = useState<TeacherAllocation[]>([]);
  const [invoices, setInvoices] = useState<SchoolInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk CSV state
  const [csvInput, setCsvInput] = useState('');
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  useEffect(() => {
    const t = tenantService.getTenant();
    setTenant(t);
    setChecklist(tenantService.getOnboardingChecklist(t.id));
    setClasses(peopleManagementService.getClasses(t.id));
    setYears(academicCalendarService.getAcademicYears(t.id));
    setAllocations(peopleManagementService.getTeacherAllocations(t.id));
    setInvoices(schoolBillingService.getInvoices(t.id));
    setLoading(false);
  }, []);

  const handleBulkImport = () => {
    const res = peopleManagementService.bulkImportUsers(csvInput, 'learners');
    if (res.success) {
      setCsvStatus(`Successfully imported ${res.importedCount} learners!`);
    } else {
      setCsvStatus(`Import error: ${res.errors.join(', ')}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" /> {tenant?.name || 'Soma School OS'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Unified academic operating system for school management, class allocations, calendars &amp; billing.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase">
            Workspace Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'SETUP', label: 'Academic Setup & Checklist' },
          { id: 'CLASSES', label: `Classes & Streams (${classes.length})` },
          { id: 'CALENDAR', label: 'Academic Calendar' },
          { id: 'PEOPLE', label: 'People Directory & Import' },
          { id: 'BILLING', label: 'Billing & AI Credits' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {activeTab === 'SETUP' && checklist && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> 7-Step Guided School Setup Checklist
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { label: '1. School Identity & Details', isDone: checklist.schoolDetailsCompleted },
                  { label: '2. Academic Year & Terms Configured', isDone: checklist.academicYearConfigured },
                  { label: '3. Grades, Forms & Streams Created', isDone: checklist.classesCreated },
                  { label: '4. Teachers Imported & Assigned', isDone: checklist.teachersImported },
                  { label: '5. Learners Imported & Enrolled', isDone: checklist.learnersImported },
                  { label: '6. Subject Allocations Completed', isDone: checklist.subjectAllocationsCompleted },
                  { label: '7. Parents & Guardians Linked', isDone: checklist.parentsLinked },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {item.isDone ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'CLASSES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {classes.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{c.grade}</span>
                      <span className="text-xs text-slate-400">Stream: {c.stream}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.learnerCount} Learners Enrolled</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'CALENDAR' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" /> Academic Years &amp; Terms
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {years.map((y) => (
                  <div key={y.id} className="py-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{y.name}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full uppercase">{y.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                      {y.terms.map((t) => (
                        <span key={t.id} className={`px-2.5 py-1 rounded-lg ${t.isCurrent ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {t.name}: {t.startDate} to {t.endDate} {t.isCurrent ? '(Current)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'PEOPLE' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm max-w-2xl mx-auto">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> Bulk User Importer (CSV)
              </h3>
              <p className="text-xs text-slate-500">Upload or paste CSV learner data with headers (Name, AdmissionNumber, Grade, Stream).</p>

              <textarea
                rows={4}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Name,AdmissionNumber,Grade,Stream&#10;Juma Omondi,ADM-101,Grade 9,Alpha&#10;Amina Mohamed,ADM-102,Grade 9,Alpha"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-mono text-slate-900 dark:text-white"
              />

              {csvStatus && <p className="text-xs font-bold text-indigo-600">{csvStatus}</p>}

              <button
                onClick={handleBulkImport}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Import Learners CSV
              </button>
            </div>
          )}

          {activeTab === 'BILLING' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" /> School Subscription &amp; Billing History
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{inv.invoiceNumber} — {inv.billingPeriod}</p>
                      <p className="text-slate-500">Issued: {inv.issuedAt.slice(0, 10)} · Due: {inv.dueDate.slice(0, 10)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white text-sm">KES {inv.amountKes.toLocaleString()}</p>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md uppercase text-[10px]">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

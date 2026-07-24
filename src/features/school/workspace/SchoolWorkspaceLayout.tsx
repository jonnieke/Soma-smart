import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  School,
  LayoutDashboard,
  FileText,
  Database,
  FolderPlus,
  Clock,
  LayoutTemplate,
  Users,
  Zap,
  Settings,
  ArrowLeft,
  Lock,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { launchFeatures } from '../../../config/launchFeatures';
import { SchoolOverviewView } from './SchoolOverviewView';
import { SchoolPapersLibraryView } from './SchoolPapersLibraryView';
import { SchoolQuestionBankView } from './SchoolQuestionBankView';
import { DepartmentManagerView } from './DepartmentManagerView';
import { ReviewQueueView } from './ReviewQueueView';
import { SchoolTemplatesView } from './SchoolTemplatesView';
import { TeacherInvitationsView } from './TeacherInvitationsView';
import { SchoolUsageView } from './SchoolUsageView';
import { SchoolSettingsView } from './SchoolSettingsView';
import { SchoolBillingView } from './SchoolBillingView';
import { schoolBillingService, SchoolSubscription } from '../../../services/schoolBillingService';

const SCHOOL_ID = 'default_school';

interface SchoolWorkspaceLayoutProps {
  onBackToTeacherStudio?: () => void;
  onCreatePaper?: () => void;
  onOpenPaper?: (paperId: string) => void;
}

export const SchoolWorkspaceLayout: React.FC<SchoolWorkspaceLayoutProps> = ({
  onBackToTeacherStudio,
  onCreatePaper,
  onOpenPaper,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);

  useEffect(() => {
    schoolBillingService.getSchoolSubscription(SCHOOL_ID).then(setSubscription);
  }, []);

  // Controlled unavailable state when feature flag disabled
  if (!launchFeatures.schoolWorkspaceEnabled) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">School Workspace Unavailable</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            The School Assessment Workspace feature flag is currently disabled in system settings. Individual teachers can continue using their private Paper Studio.
          </p>
          <button
            onClick={() => onBackToTeacherStudio ? onBackToTeacherStudio() : navigate('/teacher')}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md"
          >
            Return to Private Teacher Studio
          </button>
        </div>
      </div>
    );
  }

  // Derive active tab from current route or local state fallback
  const getTabFromPath = (): string => {
    const path = location.pathname;
    if (path.includes('/assessment/papers')) return 'papers';
    if (path.includes('/assessment/questions')) return 'questions';
    if (path.includes('/assessment/departments')) return 'departments';
    if (path.includes('/assessment/reviews')) return 'reviews';
    if (path.includes('/assessment/templates')) return 'templates';
    if (path.includes('/assessment/teachers')) return 'teachers';
    if (path.includes('/assessment/usage')) return 'usage';
    if (path.includes('/assessment/billing')) return 'billing';
    if (path.includes('/assessment/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getTabFromPath();

  const handleTabChange = (tab: string) => {
    if (tab === 'overview') navigate('/school/assessment');
    else navigate(`/school/assessment/${tab}`);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'papers', label: 'School Papers', icon: FileText },
    { id: 'questions', label: 'Question Bank', icon: Database },
    { id: 'departments', label: 'Departments', icon: FolderPlus },
    { id: 'reviews', label: 'Review Queue', icon: Clock },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'usage', label: 'Usage & AI Credits', icon: Zap },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBackToTeacherStudio ? onBackToTeacherStudio() : navigate('/teacher')}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Back to Teacher Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  Nairobi Academy High School
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active Workspace
                  </span>
                  {subscription?.status === 'ACTIVE' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" /> {subscription.planName}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1 cursor-pointer" onClick={() => handleTabChange('billing')}>
                      <AlertTriangle className="w-2.5 h-2.5" /> No Subscription
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Collaborative Examination Board &amp; Departmental Approval Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreatePaper ? onCreatePaper() : navigate('/teacher/paper-studio/create')}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm transition"
            >
              + New School Exam
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Sub View */}
      <div className="min-h-[60vh]">
        {activeTab === 'overview' && (
          <SchoolOverviewView
            onNavigateTab={handleTabChange}
            onCreatePaper={() => onCreatePaper ? onCreatePaper() : navigate('/teacher/paper-studio/create')}
            onOpenPaper={(id) => onOpenPaper ? onOpenPaper(id) : navigate(`/teacher/paper-studio/editor/${id}`)}
          />
        )}

        {activeTab === 'papers' && (
          <SchoolPapersLibraryView
            onCreatePaper={() => onCreatePaper ? onCreatePaper() : navigate('/teacher/paper-studio/create')}
            onOpenPaper={(id) => onOpenPaper ? onOpenPaper(id) : navigate(`/teacher/paper-studio/editor/${id}`)}
          />
        )}

        {activeTab === 'questions' && <SchoolQuestionBankView />}
        {activeTab === 'departments' && <DepartmentManagerView />}
        {activeTab === 'reviews' && (
          <ReviewQueueView
            onOpenPaper={(id) => onOpenPaper ? onOpenPaper(id) : navigate(`/teacher/paper-studio/editor/${id}`)}
          />
        )}
        {activeTab === 'templates' && <SchoolTemplatesView />}
        {activeTab === 'teachers' && <TeacherInvitationsView />}
        {activeTab === 'usage' && <SchoolUsageView />}
        {activeTab === 'billing' && (
          <SchoolBillingView
            schoolId={SCHOOL_ID}
            canManage={true}
            onSubscriptionChange={(sub) => setSubscription(sub)}
          />
        )}
        {activeTab === 'settings' && <SchoolSettingsView />}
      </div>
    </div>
  );
};

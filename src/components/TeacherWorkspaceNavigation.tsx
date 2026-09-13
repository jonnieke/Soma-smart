import React from 'react';
import { BookOpenCheck, ExternalLink, Home, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const DASHBOARD_SHELL_PATHS = new Set([
  '/teacher',
  '/teacher/notes',
  '/teacher/homework',
  '/teacher/marking',
  '/teacher/syllabus',
  '/teacher/darasa',
]);

const shouldShowTeacherWorkspaceNavigation = (pathname: string) =>
  pathname.startsWith('/teacher/') && !DASHBOARD_SHELL_PATHS.has(pathname);

const destinations = [
  { label: 'Teacher home', mobileLabel: 'Home', to: '/teacher', icon: Home, active: (path: string) => path === '/teacher' },
  { label: 'Paper Studio', mobileLabel: 'Paper Studio', to: '/teacher/paper-studio', icon: BookOpenCheck, active: (path: string) => path.startsWith('/teacher/paper-studio') || path === '/teacher/school-library' },
  { label: 'Sell materials', mobileLabel: 'Sell', to: '/teacher/creator-studio', icon: Store, active: (path: string) => path === '/teacher/earnings' || path.startsWith('/teacher/creator-studio') || path.startsWith('/teacher/seller') },
] as const;

export const TeacherWorkspaceNavigation: React.FC = () => {
  const { pathname } = useLocation();
  if (!shouldShowTeacherWorkspaceNavigation(pathname)) return null;

  return (
    <nav aria-label="Teacher workspace" className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/teacher" className="text-sm font-black text-slate-900 hover:text-indigo-700">
            Soma AI <span className="font-semibold text-slate-500">· Teacher workspace</span>
          </Link>
          <Link to="/" state={{ fromDashboard: true }} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-700 md:hidden">
            Soma homepage <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid w-full grid-cols-3 items-center gap-1 md:flex md:w-auto md:gap-2">
          {destinations.map(({ label, mobileLabel, to, icon: Icon, active }) => {
            const isActive = active(pathname);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:gap-2 sm:px-3.5 sm:text-sm ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Icon className="h-4 w-4" /> <span aria-hidden="true" className="sm:hidden">{mobileLabel}</span><span aria-hidden="true" className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <Link to="/" state={{ fromDashboard: true }} className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-indigo-700 md:inline-flex">
            Soma homepage <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

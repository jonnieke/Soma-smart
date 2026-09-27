import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';

/** Always visible in the sticky dashboard header, including narrow screens. */
export const TeacherAssessmentNavigation = () => (
  <nav aria-label="Assessment tools" className="border-t border-slate-100 bg-white">
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 md:px-8">
      <Link to="/teacher/paper-studio" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
        <ClipboardList aria-hidden="true" className="h-5 w-5 shrink-0" />
        Paper Studio
      </Link>
      <Link to="/teacher/paper-studio/create" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
        <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
        Create an assessment
      </Link>
    </div>
  </nav>
);

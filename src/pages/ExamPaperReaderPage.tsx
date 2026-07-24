import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileCheck2, FileText, Loader2, Share2 } from 'lucide-react';
import { PaperAccess, examPaperBankService } from '../services/examPaperBankService';
import { useApp } from '../context/AppContext';

export const ExamPaperReaderPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isPro } = useApp();
  const [access, setAccess] = React.useState<PaperAccess | null>(null);
  const [activeDocument, setActiveDocument] = React.useState<'paper' | 'scheme'>('paper');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    examPaperBankService.getAccess(id)
      .then((result) => {
        if (!result.paid) navigate(`/exam-papers?paper=${encodeURIComponent(id)}`, { replace: true });
        else setAccess(result);
      })
      .catch(() => navigate(`/exam-papers?paper=${encodeURIComponent(id)}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const currentUrl = activeDocument === 'scheme' ? access?.markingSchemeUrl : access?.paperUrl;

  const share = async () => {
    const url = `${window.location.origin}/exam-papers?paper=${encodeURIComponent(id)}`;
    const payload = { title: access?.title || 'SomaAI Exam Paper', text: 'Open this SomaAI Original exam paper and marking scheme.', url };
    if (navigator.share) await navigator.share(payload);
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url); window.alert('Paper link copied.'); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!access) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => navigate('/exam-papers')} className="rounded-xl border border-slate-200 p-2.5 text-slate-600" aria-label="Back to paper bank"><ArrowLeft className="h-5 w-5" /></button>
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Your exam paper</p><h1 className="truncate text-sm font-black text-slate-950 sm:text-base">{access.title}</h1></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveDocument('paper')} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${activeDocument === 'paper' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}><FileText className="h-4 w-4" /> Exam paper</button>
            <button onClick={() => setActiveDocument('scheme')} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${activeDocument === 'scheme' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}><FileCheck2 className="h-4 w-4" /> Marking scheme</button>
            <button onClick={() => void share()} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700" aria-label="Share paper"><Share2 className="h-5 w-5" /></button>
            <button onClick={() => navigate(`/revision?paper=${encodeURIComponent(id)}`)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white"><BookOpen className="h-4 w-4" /> {isPro ? 'Revision Mode' : 'Revision Mode unlocked'}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1500px] flex-1 p-3 sm:p-5">
        {currentUrl ? <iframe title={activeDocument === 'paper' ? 'Exam paper' : 'Marking scheme'} src={currentUrl} className="min-h-[calc(100vh-112px)] w-full rounded-xl border border-slate-200 bg-white shadow-sm" /> : <div className="flex min-h-[60vh] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center"><div><FileCheck2 className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-black">Marking scheme is being prepared</h2><p className="mt-2 text-sm text-slate-500">The exam paper remains available while the scheme is verified.</p></div></div>}
      </main>
    </div>
  );
};

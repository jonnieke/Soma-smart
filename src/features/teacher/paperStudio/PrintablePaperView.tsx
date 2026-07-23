import React, { useState } from 'react';
import { Printer, Download, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { ExamPaper } from '../../../types/paperStudio';

interface PrintViewProps {
  paper: ExamPaper;
  onClose: () => void;
}

export const PrintablePaperView: React.FC<PrintViewProps> = ({ paper, onClose }) => {
  const [viewMode, setViewMode] = useState<'QUESTION_PAPER' | 'MARKING_SCHEME'>('QUESTION_PAPER');

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExportDocx = () => {
    alert('Exporting editable DOCX document...');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Printable CSS Rules for A4 Layout */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-canvas {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm !important;
          }
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      {/* Top Controls Toolbar */}
      <header className="no-print h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-white">{paper.title}</h1>
            <p className="text-[11px] text-slate-400 font-medium">Print Preview &amp; PDF Export Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-800 p-1">
            <button
              onClick={() => setViewMode('QUESTION_PAPER')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === 'QUESTION_PAPER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Question Paper
            </button>
            <button
              onClick={() => setViewMode('MARKING_SCHEME')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === 'MARKING_SCHEME' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Marking Scheme &amp; Answer Key
            </button>
          </div>

          <button
            onClick={handleExportDocx}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
          >
            <Download className="w-4 h-4 text-indigo-400" /> Export DOCX
          </button>

          <button
            onClick={handleTriggerPrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </header>

      {/* Main Print Paper Canvas (A4 Simulation) */}
      <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-900">
        <div className="print-canvas w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-[15mm] shadow-2xl rounded-sm font-serif space-y-6">
          {/* Header Block */}
          <div className="border-b-2 border-slate-950 pb-4 text-center space-y-1.5">
            <h2 className="text-xl font-black uppercase tracking-wider">
              {paper.schoolBranding.schoolName || 'KENYA NATIONAL EXAMINATIONS'}
            </h2>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
              {paper.title}
            </h3>
            {viewMode === 'MARKING_SCHEME' && (
              <span className="inline-block px-3 py-0.5 rounded-full bg-slate-950 text-white text-xs font-sans font-black uppercase tracking-widest">
                Official Marking Scheme &amp; Answer Key
              </span>
            )}

            {/* Metadata Table */}
            <div className="grid grid-cols-2 gap-2 text-xs font-sans font-bold pt-3 border-t border-slate-300 mt-2 text-left">
              <div>SUBJECT: <span className="font-normal">{paper.subject}</span></div>
              <div>GRADE/FORM: <span className="font-normal">{paper.grade}</span></div>
              <div>DATE: <span className="font-normal">{paper.schoolBranding.examDate || new Date().toISOString().split('T')[0]}</span></div>
              <div>DURATION: <span className="font-normal">{paper.durationMinutes} Minutes</span></div>
              <div>EXAMINER: <span className="font-normal">{paper.schoolBranding.teacherName || 'Soma Paper Studio'}</span></div>
              <div>TOTAL MARKS: <span className="font-black">{paper.totalMarks} MARKS</span></div>
            </div>

            {/* Candidate Fields */}
            {viewMode === 'QUESTION_PAPER' && (
              <div className="grid grid-cols-2 gap-4 pt-3 text-xs font-sans font-bold text-left border-t border-slate-200 mt-2">
                <div className="flex items-center gap-2">
                  <span>CANDIDATE NAME:</span>
                  <div className="flex-1 border-b border-slate-950 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span>ADM NO:</span>
                  <div className="flex-1 border-b border-slate-950 h-4" />
                </div>
              </div>
            )}
          </div>

          {/* Candidate Instructions */}
          {paper.instructions.length > 0 && viewMode === 'QUESTION_PAPER' && (
            <div className="font-sans text-xs bg-slate-50 p-3 border border-slate-300 space-y-1">
              <span className="font-bold uppercase text-[10px] text-slate-600 block">INSTRUCTIONS TO CANDIDATES:</span>
              <ul className="list-disc pl-4 space-y-0.5 font-medium text-slate-800">
                {paper.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections & Questions */}
          <div className="space-y-8 pt-2">
            {paper.sections.map((sec) => (
              <div key={sec.id} className="space-y-4">
                <div className="font-sans font-black text-sm uppercase tracking-wide border-b-2 border-slate-900 pb-1 flex justify-between">
                  <span>{sec.title}</span>
                  <span>[{sec.totalMarks} MARKS]</span>
                </div>

                <div className="space-y-6">
                  {sec.questions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-2 text-sm leading-relaxed">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <p className="font-normal">
                            <span className="font-bold mr-1.5">{qIdx + 1}.</span> {q.questionText}
                          </p>

                          {/* MCQ Options */}
                          {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                            <div className="grid grid-cols-2 gap-2 pl-4 pt-1 font-sans text-xs font-medium">
                              {q.options.map((opt) => (
                                <div key={opt.id}>
                                  <span className="font-bold mr-1">{opt.id}.</span> {opt.text}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Working Lines / Answer Box for Question Paper View */}
                          {viewMode === 'QUESTION_PAPER' && q.questionType !== 'MULTIPLE_CHOICE' && (
                            <div className="pt-2 space-y-1">
                              <div className="w-full border-b border-slate-300 h-6" />
                              <div className="w-full border-b border-slate-300 h-6" />
                              <div className="w-full border-b border-slate-300 h-6" />
                            </div>
                          )}

                          {/* Marking Scheme Answer Key View */}
                          {viewMode === 'MARKING_SCHEME' && (
                            <div className="font-sans text-xs bg-emerald-50 p-3 rounded-md border border-emerald-200 text-emerald-950 space-y-1 mt-2">
                              <div className="font-bold text-emerald-900">
                                Expected Answer: <span className="font-normal">{q.correctAnswer}</span>
                              </div>
                              {q.markingScheme && q.markingScheme.length > 0 && (
                                <div className="pt-1">
                                  <span className="font-bold text-[10px] uppercase text-emerald-800">Mark Breakdown:</span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {q.markingScheme.map((item, mIdx) => (
                                      <li key={mIdx}>
                                        {item.criterion} — <span className="font-bold">{item.marks} Mark(s)</span> ({item.code || 'M1'})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="font-sans text-xs font-bold shrink-0">
                          [{q.marks} Mks]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* End of Paper Indicator */}
          <div className="pt-10 text-center font-sans font-black text-xs uppercase tracking-widest text-slate-500 border-t border-slate-200">
            *** END OF EXAMINATION PAPER ***
          </div>
        </div>
      </main>
    </div>
  );
};

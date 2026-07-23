import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, X, Sparkles, Loader2 } from 'lucide-react';
import { paperUploadExtractor, ExtractionProgress } from '../../../services/assessmentEngine/paperUploadExtractor';
import { paperStudioService } from '../../../services/paperStudioService';
import { ExamPaper } from '../../../types/paperStudio';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperCreated: (paperId: string) => void;
}

export const UploadPaperModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onPaperCreated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [copyrightAccepted, setCopyrightAccepted] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a PDF, DOCX, or Image file first.');
      return;
    }
    if (!copyrightAccepted) {
      setErrorMsg('You must accept the copyright indemnity declaration before processing.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // Deduct 2 AI credits for document parsing
      paperStudioService.deductCredits(2);

      const result = await paperUploadExtractor.extractPaperBlueprint(file, (p) => {
        setProgress(p);
      });

      // Construct Exam Paper from extracted blueprint
      const newPaper: ExamPaper = {
        id: `paper_upload_${Date.now()}`,
        ownerId: 'teacher_user',
        title: result.blueprint.title,
        status: 'DRAFT',
        visibility: 'PRIVATE',
        grade: result.detectedGrade,
        subject: result.detectedSubject,
        examType: 'CAT',
        term: 'Term 1',
        year: new Date().getFullYear(),
        durationMinutes: result.detectedDurationMinutes,
        totalMarks: result.detectedTotalMarks,
        schoolBranding: {
          schoolName: 'Nairobi Academy',
          teacherName: 'Mwalimu Peterson',
          examDate: new Date().toISOString().split('T')[0],
          candidateNameField: true,
          admissionNoField: true,
        },
        instructions: [
          'Answer all questions in the spaces provided.',
          'Show all your working clearly.',
        ],
        sections: [
          {
            id: 'sec_upload_1',
            title: 'Section A: Extracted & Equivalent Assessment Questions',
            instructions: 'Answer all questions.',
            totalMarks: result.detectedTotalMarks,
            questions: result.equivalentQuestions,
          },
        ],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await paperStudioService.savePaper(newPaper);
      onClose();
      onPaperCreated(newPaper.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract paper blueprint.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Upload-to-Blueprint Engine
          </div>
          <h2 className="text-xl font-black text-slate-900">Upload Exam Document</h2>
          <p className="text-xs text-slate-500 font-medium">
            Upload an existing PDF, DOCX, or scanned exam paper to extract its blueprint and generate equivalent independent practice questions.
          </p>
        </div>

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 rounded-2xl p-6 text-center space-y-3 transition cursor-pointer"
          onClick={() => document.getElementById('paper_file_input')?.click()}
        >
          <input
            type="file"
            id="paper_file_input"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>

          {file ? (
            <div>
              <p className="text-xs font-bold text-slate-900">{file.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-800">Drag &amp; drop PDF, DOCX, or image file here</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports scanned papers up to 20MB</p>
            </div>
          )}
        </div>

        {/* Mandatory Copyright Indemnity Narrative */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Copyright Declaration &amp; Indemnity Policy</span>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-amber-800">
            The teacher carries full responsibility in case of copyright infringement. SomaAI is indemnified of any use of materials posing infringement of rights or permissions.
          </p>

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={copyrightAccepted}
              onChange={(e) => setCopyrightAccepted(e.target.checked)}
              className="mt-0.5 rounded border-amber-400 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] font-bold text-amber-950">
              I accept full responsibility for copyright compliance and confirm I have rights/permissions to upload this material.
            </span>
          </label>
        </div>

        {/* Progress State Bar */}
        {isProcessing && progress && (
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                {progress.message}
              </span>
              <span>{progress.percent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={isProcessing || !file || !copyrightAccepted}
            onClick={handleProcessUpload}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isProcessing ? 'Extracting Blueprint...' : 'Extract & Generate Paper'}
          </button>
        </div>
      </div>
    </div>
  );
};

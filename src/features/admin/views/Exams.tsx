import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeInfo,
  CheckCircle,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Shared';
import { ingestPastPaper } from '../../../services/geminiService';
import { contentNotificationService } from '../../../services/contentNotificationService';
import { ExamAnalysis } from '../../../types';
interface Exam {
  id: string;
  title: string;
  subject: string;
  className: string;
  created_at: string;
  fileUrl?: string | null;
  filePath?: string | null;
  markingSchemeUrl?: string | null;
  markingSchemePath?: string | null;
  examBody?: string | null;
  examType?: string | null;
  examYear?: number | null;
  paperCode?: string | null;
  paperNumber?: string | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  reviewStatus: 'DRAFT' | 'PUBLISHED';
  indexingStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  lastIndexError?: string | null;
  source?: string | null;
  isOfficial?: boolean;
  homepageFeatured?: boolean;
  questionCount: number;
}
const SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Biology',
  'Chemistry',
  'Physics',
  'Integrated Science',
  'Science',
  'Social Studies',
  'History',
  'Geography',
  'CRE',
  'IRE',
  'Agriculture',
  'Business Studies',
  'Computer Studies',
  'Home Science',
  'Music',
  'Art & Design',
  'Physical Education (PE)',
  'French',
  'German',
  'Arabic',
  'Indigenous Language',
];
const currentYear = new Date().getFullYear();
const EXAM_BODIES = ['SomaAI', 'KNEC', 'Cambridge', 'School Mock', 'County Mock', 'Other'];
const normalizeExamType = (value: unknown): 'KCSE' | 'KPSEA' | 'KJSEA' | 'OTHER' => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (normalized === 'KCSE') return 'KCSE';
  if (
    normalized === 'KPSEA' ||
    normalized === 'KPSEA_STYLE' ||
    normalized === 'KPSEA-STYLE' ||
    normalized === 'KPSEA STYLE'
  )
    return 'KPSEA';
  if (normalized === 'KJSEA') return 'KJSEA';
  return 'OTHER';
};
export const ExamsView: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [indexingExamId, setIndexingExamId] = useState<string | null>(null);
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [markingSchemeFile, setMarkingSchemeFile] = useState<File | null>(null);
  const [analyzedData, setAnalyzedData] = useState<ExamAnalysis | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Form 4');
  const [examBody, setExamBody] = useState('SomaAI');
  const [examType, setExamType] = useState<'KCSE' | 'KPSEA' | 'KJSEA' | 'OTHER'>('KCSE');
  const [examYear, setExamYear] = useState(String(currentYear));
  const [paperCode, setPaperCode] = useState('');
  const [paperNumber, setPaperNumber] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [featureOnHomepage, setFeatureOnHomepage] = useState(true);
  const [inputMode, setInputMode] = useState<'UPLOAD' | 'STRUCTURED_JSON'>('UPLOAD');
  const [structuredJson, setStructuredJson] = useState('');
  const [structuredJsonFile, setStructuredJsonFile] = useState<File | null>(null);
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);
  const [attachmentExam, setAttachmentExam] = useState<Exam | null>(null);
  const [attachmentPaperFile, setAttachmentPaperFile] = useState<File | null>(null);
  const [attachmentSchemeFile, setAttachmentSchemeFile] = useState<File | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editGrade, setEditGrade] = useState('Form 4');
  const [editExamBody, setEditExamBody] = useState('SomaAI');
  const [editExamType, setEditExamType] = useState<'KCSE' | 'KPSEA' | 'KJSEA' | 'OTHER'>('OTHER');
  const [editExamYear, setEditExamYear] = useState(String(currentYear));
  const [editPaperCode, setEditPaperCode] = useState('');
  const [editPaperNumber, setEditPaperNumber] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState('');
  const [editTotalMarks, setEditTotalMarks] = useState('');
  const [editReviewStatus, setEditReviewStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [editHomepageFeatured, setEditHomepageFeatured] = useState(false);
  const buildStructuredTemplate = () =>
    JSON.stringify(
      {
        exam: {
          title,
          examBody,
          examType,
          grade,
          subject,
          paperCode,
          paperNumber,
          year: Number(examYear) || currentYear,
          durationMinutes: Number(durationMinutes) || 0,
          totalMarks: Number(totalMarks) || 0,
          instructions: [],
        },
        questions: [
          {
            id: 'Q1',
            number: '1',
            orderIndex: 1,
            section: 'I',
            questionType: 'multiple_choice',
            text: 'Question text here',
            topic: subject || 'General',
            marks: 1,
            options: ['A', 'B', 'C', 'D'],
            answer: 'A',
          },
        ],
      },
      null,
      2
    );
  const useStructuredTemplate = () => {
    setInputMode('STRUCTURED_JSON');
    setStructuredJson(buildStructuredTemplate());
    setStructuredJsonFile(null);
    setJsonImportError(null);
    setAnalyzedData(null);
    setPublishImmediately(false);
    setFeatureOnHomepage(false);
  };
  useEffect(() => {
    fetchExams();
  }, []);
  const resetForm = () => {
    setPaperFile(null);
    setMarkingSchemeFile(null);
    setAnalyzedData(null);
    setTitle('');
    setSubject('Mathematics');
    setGrade('Form 4');
    setExamBody('SomaAI');
    setExamType('KCSE');
    setExamYear(String(currentYear));
    setPaperCode('');
    setPaperNumber('');
    setDurationMinutes('');
    setTotalMarks('');
    setPublishImmediately(true);
    setFeatureOnHomepage(true);
    setInputMode('UPLOAD');
    setStructuredJson('');
    setStructuredJsonFile(null);
    setJsonImportError(null);
  };
  const closeModal = () => {
    if (uploading || saving) return;
    setShowAdd(false);
    resetForm();
  };
  const closeAttachmentModal = () => {
    if (uploading || saving) return;
    setAttachmentExam(null);
    setAttachmentPaperFile(null);
    setAttachmentSchemeFile(null);
  };
  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setEditTitle(exam.title || '');
    setEditSubject(exam.subject || 'Mathematics');
    setEditGrade(exam.className || 'Form 4');
    setEditExamBody(exam.examBody || 'SomaAI');
    setEditExamType(normalizeExamType(exam.examType));
    setEditExamYear(exam.examYear ? String(exam.examYear) : String(currentYear));
    setEditPaperCode(exam.paperCode || '');
    setEditPaperNumber(exam.paperNumber || '');
    setEditDurationMinutes(exam.durationMinutes ? String(exam.durationMinutes) : '');
    setEditTotalMarks(exam.totalMarks ? String(exam.totalMarks) : '');
    setEditReviewStatus(exam.reviewStatus);
    setEditHomepageFeatured(Boolean(exam.homepageFeatured));
  };
  const closeEditModal = () => {
    if (saving) return;
    setEditingExam(null);
  };
  const saveExamMetadata = async () => {
    if (!editingExam || saving) return;
    if (!editTitle.trim() || !editSubject.trim() || !editGrade.trim()) {
      alert('Title, subject, and grade are required.');
      return;
    }
    setSaving(true);
    try {
      const resolvedYear = Number(editExamYear);
      const resolvedDuration = Number(editDurationMinutes);
      const resolvedMarks = Number(editTotalMarks);
      const updates = {
        title: editTitle.trim(),
        grade: editGrade.trim(),
        subject: editSubject.trim(),
        exam_body: editExamBody.trim() || null,
        exam_type: editExamType,
        exam_year: Number.isFinite(resolvedYear) ? resolvedYear : null,
        paper_code: editPaperCode.trim() || null,
        paper_number: editPaperNumber.trim() || null,
        duration_minutes: Number.isFinite(resolvedDuration) && resolvedDuration > 0 ? resolvedDuration : null,
        total_marks: Number.isFinite(resolvedMarks) && resolvedMarks >= 0 ? resolvedMarks : null,
        review_status: editReviewStatus,
        homepage_featured: editReviewStatus === 'PUBLISHED' && editHomepageFeatured,
      };
      const { error } = await supabase
        .from('knowledge_base')
        .update(updates)
        .eq('id', editingExam.id);
      if (error) throw error;
      if (editReviewStatus === 'PUBLISHED' && editingExam.reviewStatus !== 'PUBLISHED') {
        contentNotificationService.notifyExamPaperPublished({
          id: editingExam.id,
          title: updates.title,
          grade: updates.grade,
          subject: updates.subject,
        }).catch((notifyError) => console.warn('Exam paper notification failed:', notifyError));
      }
      setEditingExam(null);
      await fetchExams();
    } catch (error) {
      console.error('Update exam metadata failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown update error';
      alert('Failed to update exam package. ' + message);
    } finally {
      setSaving(false);
    }
  };
  const buildExamStorageMeta = (paperTitle: string, paperExamType: string | null | undefined, paperExamYear: number | null | undefined, paperSubject: string) => {
    const safeTitle =
      String(paperTitle)
        .replace(/[^a-z0-9-_]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80) || 'past_paper';
    const folder = [paperExamType || 'OTHER', paperExamYear || 'unknown-year', paperSubject]
      .map((value) => String(value).replace(/[^a-z0-9-_]+/gi, '_'))
      .join('/');
    return { safeTitle, folder };
  };
  const attachFilesToExam = async () => {
    if (!attachmentExam || !attachmentPaperFile || saving || uploading) return;
    setSaving(true);
    const uploadedPaths: string[] = [];
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No active admin session. Please log in again.');
      const { safeTitle, folder } = buildExamStorageMeta(
        attachmentExam.title,
        attachmentExam.examType,
        attachmentExam.examYear,
        attachmentExam.subject
      );
      const stamp = Date.now();
      const existingPaperPath = attachmentExam.filePath || null;
      const existingSchemePath = attachmentExam.markingSchemePath || null;
      let paperPath: string | null = null;
      let paperUrl: string | null = attachmentExam.fileUrl || null;
      let schemePath: string | null = null;
      let schemeUrl: string | null = attachmentExam.markingSchemeUrl || null;
      const paperExt = attachmentPaperFile.name.split('.').pop() || 'pdf';
      paperPath = folder + '/' + stamp + '_' + safeTitle + '.' + paperExt;
      const { error: paperUploadError } = await supabase.storage
        .from('syllabus-docs')
        .upload(paperPath, attachmentPaperFile, { upsert: false });
      if (paperUploadError) throw paperUploadError;
      uploadedPaths.push(paperPath);
      paperUrl = supabase.storage.from('syllabus-docs').getPublicUrl(paperPath).data.publicUrl;
      if (attachmentSchemeFile) {
        const schemeExt = attachmentSchemeFile.name.split('.').pop() || 'pdf';
        schemePath = folder + '/' + stamp + '_' + safeTitle + '_marking_scheme.' + schemeExt;
        const { error: schemeUploadError } = await supabase.storage
          .from('syllabus-docs')
          .upload(schemePath, attachmentSchemeFile, { upsert: false });
        if (schemeUploadError) throw schemeUploadError;
        uploadedPaths.push(schemePath);
        schemeUrl = supabase.storage.from('syllabus-docs').getPublicUrl(schemePath).data.publicUrl;
      }
      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update({
          file_url: paperUrl,
          file_path: paperPath,
          ...(attachmentSchemeFile
            ? { marking_scheme_url: schemeUrl, marking_scheme_path: schemePath }
            : {}),
        })
        .eq('id', attachmentExam.id);
      if (updateError) throw updateError;
      if (existingPaperPath && existingPaperPath !== paperPath) {
        await supabase.storage.from('syllabus-docs').remove([existingPaperPath]).catch(() => null);
      }
      if (attachmentSchemeFile && existingSchemePath && existingSchemePath !== schemePath) {
        await supabase.storage.from('syllabus-docs').remove([existingSchemePath]).catch(() => null);
      }
      setAttachmentExam(null);
      setAttachmentPaperFile(null);
      setAttachmentSchemeFile(null);
      await fetchExams();
      alert('Exam paper attached successfully.');
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('syllabus-docs').remove(uploadedPaths).catch(() => null);
      }
      console.error('Attach exam paper failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown attachment error';
      alert('Failed to attach exam paper. ' + message);
    } finally {
      setSaving(false);
    }
  };
  const fetchExams = async () => {
    try {
      setLoading(true);
      const normalizeRow = (row: any) => ({
        id: String(row.id),
        title: row.title,
        subject: row.subject || 'General',
        className: row.grade || 'Any',
        created_at: row.created_at,
        fileUrl: row.file_url || row.fileUrl || null,
        filePath: row.file_path || row.filePath || null,
        markingSchemeUrl: row.marking_scheme_url || row.markingSchemeUrl || null,
        markingSchemePath: row.marking_scheme_path || row.markingSchemePath || null,
        examBody: row.exam_body || row.examBody || null,
        examType: row.exam_type,
        examYear: row.exam_year,
        paperCode: row.paper_code,
        paperNumber: row.paper_number,
        durationMinutes: row.duration_minutes,
        totalMarks: row.total_marks,
        reviewStatus: (row.review_status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED') as Exam['reviewStatus'],
        indexingStatus: ['PROCESSING', 'READY', 'FAILED'].includes(row.indexing_status)
          ? row.indexing_status
          : 'PENDING',
        lastIndexError: row.last_index_error,
        questionCount: Array.isArray(row.structured_questions)
          ? row.structured_questions.length
          : 0,
        source: row.source,
        isOfficial: row.is_official,
        homepageFeatured: row.homepage_featured,
      });
      const [{ data: rpcData, error: rpcError }, { data: tableData, error: tableError }] = await Promise.all([
        supabase.rpc('list_published_exams', { p_grade: null, p_subject: null }),
        supabase
          .from('knowledge_base')
          .select(
            'id, title, subject, grade, file_url, file_path, marking_scheme_url, marking_scheme_path, exam_body, exam_type, exam_year, paper_code, paper_number, duration_minutes, total_marks, review_status, structured_questions, indexing_status, last_index_error, source, is_official, homepage_featured, created_at'
          )
          .eq('type', 'PAST_PAPER')
          .order('created_at', { ascending: false }),
      ]);
      if (rpcError) console.warn('Published exam RPC failed:', rpcError);
      if (tableError) console.warn('Admin exam table query failed:', tableError);
      const combined = [
        ...(Array.isArray(tableData) ? tableData : []),
        ...(Array.isArray(rpcData) ? rpcData : []),
      ];
      const deduped = Array.from(
        new Map(combined.map((row: any) => [String(row.id), row])).values()
      );
      const sorted = deduped
        .map(normalizeRow)
        .sort((a, b) => {
          if (a.reviewStatus !== b.reviewStatus) {
            return a.reviewStatus === 'PUBLISHED' ? -1 : 1;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      setExams(sorted);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAnalyze = async () => {
    if (uploading) return;
    setUploading(true);
    setJsonImportError(null);
    try {
      if (inputMode === 'STRUCTURED_JSON') {
        const rawJson = structuredJsonFile ? await structuredJsonFile.text() : structuredJson;
        const parsed = JSON.parse(rawJson);
        const examPayload = parsed?.exam || parsed;
        const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
        if (!examPayload || rawQuestions.length === 0) {
          throw new Error('Provide an exam object and at least one question.');
        }
        const normalizedQuestions = rawQuestions.map((question: any, index: number) => ({
          id: question.id ?? index + 1,
          number: String(question.number ?? index + 1),
          orderIndex: Number.isFinite(Number(question.orderIndex))
            ? Number(question.orderIndex)
            : index + 1,
          text: String(question.text ?? question.questionText ?? ''),
          topic: String(question.topic ?? examPayload.subject ?? subject ?? 'General'),
          section: question.section ?? '',
          questionType:
            String(question.questionType ?? question.type ?? '').toLowerCase() === 'mcq'
              ? 'multiple_choice'
              : (question.questionType ?? question.type ?? 'structured_text'),
          options: Array.isArray(question.options) ? question.options.map(String) : [],
          diagramUrl:
            question.diagramUrl ??
            question.diagram_url ??
            question.imageUrl ??
            question.image_url ??
            question.figureUrl ??
            question.figure_url ??
            question.illustrationUrl ??
            question.illustration_url ??
            null,
          answerFormat: {
            ...(question.answerFormat ?? question.answer_format ?? {}),
            ...(question.diagramPage || question.diagram_page
              ? { diagramPage: question.diagramPage ?? question.diagram_page }
              : {}),
            ...(question.diagramDescription || question.diagram_description
              ? { diagramDescription: question.diagramDescription ?? question.diagram_description }
              : {}),
          },
          marks: Number(question.marks ?? 0),
          markingScheme: Array.isArray(question.markingScheme)
            ? question.markingScheme
            : Array.isArray(question.marking_scheme)
              ? question.marking_scheme
              : question.answer
                ? [String(question.answer)]
                : [],
          modelAnswer: question.modelAnswer ?? question.model_answer ?? question.answer ?? '',
          explanation: question.explanation ?? '',
          commonMistakes: Array.isArray(question.commonMistakes)
            ? question.commonMistakes
            : Array.isArray(question.common_mistakes)
              ? question.common_mistakes
              : [],
        }));
        const resolvedExamType = normalizeExamType(
          examPayload.examType ?? examPayload.exam_type ?? examType
        );
        const resolvedExamBody = String(
          examPayload.examBody ?? examPayload.exam_body ?? examBody ?? 'SomaAI'
        ).trim();
        setAnalyzedData({
          subject: String(examPayload.subject ?? subject ?? 'General'),
          grade: String(examPayload.grade ?? grade ?? 'Form 4'),
          examBody: resolvedExamBody,
          examType: resolvedExamType,
          year: Number(examPayload.year ?? examPayload.examYear ?? examYear) || currentYear,
          paperCode: String(examPayload.paperCode ?? examPayload.paper_code ?? paperCode ?? ''),
          paperNumber: String(
            examPayload.paperNumber ?? examPayload.paper_number ?? paperNumber ?? ''
          ),
          durationMinutes:
            Number(
              examPayload.durationMinutes ?? examPayload.duration_minutes ?? durationMinutes
            ) || undefined,
          totalMarks:
            Number(examPayload.totalMarks ?? examPayload.total_marks ?? totalMarks) || undefined,
          instructions: Array.isArray(examPayload.instructions) ? examPayload.instructions : [],
          markingSchemeSource: 'AI_DRAFT',
          questions: normalizedQuestions,
        });
        setTitle(String(examPayload.title ?? 'Structured exam').trim());
        setSubject(String(examPayload.subject ?? subject ?? 'General'));
        setGrade(String(examPayload.grade ?? grade ?? 'Form 4'));
        setExamBody(resolvedExamBody);
        setExamType(resolvedExamType);
        setExamYear(String(examPayload.year ?? examPayload.examYear ?? currentYear));
        setPaperCode(String(examPayload.paperCode ?? examPayload.paper_code ?? ''));
        setPaperNumber(String(examPayload.paperNumber ?? examPayload.paper_number ?? ''));
        setDurationMinutes(
          String(examPayload.durationMinutes ?? examPayload.duration_minutes ?? '')
        );
        setTotalMarks(String(examPayload.totalMarks ?? examPayload.total_marks ?? ''));
        setPublishImmediately(false);
        setFeatureOnHomepage(false);
        return;
      }
      if (!paperFile) {
        throw new Error('Choose a question paper before analyzing.');
      }
      const result = await ingestPastPaper(paperFile, markingSchemeFile);
      setAnalyzedData(result);
      const inferredTitle = paperFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setTitle((current) => current.trim() || inferredTitle);
      setSubject((current) =>
        current.trim() && current !== 'Mathematics' ? current : result.subject || current || 'Mathematics'
      );
      setGrade((current) =>
        current.trim() && current !== 'Form 4'
          ? current
          : result.grade || (result.examType === 'KPSEA' ? 'Grade 6' : current || 'Form 4')
      );
      setExamBody((current) => current.trim() || result.examBody || 'SomaAI');
      setExamType((current) =>
        current && current !== 'KCSE' ? current : result.examType || current || 'OTHER'
      );
      setExamYear(result.year ? String(result.year) : String(currentYear));
      setPaperCode(result.paperCode || '');
      setPaperNumber(result.paperNumber || '');
      setDurationMinutes(result.durationMinutes ? String(result.durationMinutes) : '');
      setTotalMarks(result.totalMarks ? String(result.totalMarks) : '');
    } catch (error) {
      console.error('Ingestion failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown extraction error';
      const prefix =
        inputMode === 'STRUCTURED_JSON'
          ? 'Structured import failed. '
          : 'Somo could not structure this paper. ';
      setJsonImportError(inputMode === 'STRUCTURED_JSON' ? message : null);
      alert(prefix + message);
    } finally {
      setUploading(false);
    }
  };
  const updateQuestion = (
    questionId: string | number,
    patch: Partial<ExamAnalysis['questions'][number]>
  ) => {
    setAnalyzedData((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((question) =>
          String(question.id) === String(questionId) ? { ...question, ...patch } : question
        ),
      };
    });
  };
  const getAnalyzedQuestionMarks = () =>
    (analyzedData?.questions || []).reduce(
      (sum, question) => sum + Number(question.marks || 0),
      0
    );
  const validateExamPackage = () => {
    const issues: string[] = [];
    const questions = analyzedData?.questions || [];
    const totalQuestionMarks = getAnalyzedQuestionMarks();
    const sectionValues = Array.from(
      new Set(
        questions
          .map((question) =>
            String(question.section || '')
              .trim()
              .toUpperCase()
          )
          .filter(Boolean)
      )
    );
    const hasRomanSections = sectionValues.some((section) =>
      ['I', 'II', 'III', 'IV', 'V'].includes(section)
    );
    const sectionOneCount = questions.filter(
      (question) =>
        String(question.section || '')
          .trim()
          .toUpperCase() === 'I'
    ).length;
    const sectionTwoCount = questions.filter(
      (question) =>
        String(question.section || '')
          .trim()
          .toUpperCase() === 'II'
    ).length;
    if (!title.trim()) issues.push('Title is required.');
    if (!subject.trim()) issues.push('Subject is required.');
    if (!grade.trim()) issues.push('Grade / level is required.');
    if (!examType.trim()) issues.push('Exam type is required.');
    if (!analyzedData) issues.push('Analyze or import the exam first.');
    if (questions.length === 0) issues.push('Add at least one question.');
    if (questions.some((question) => !String(question.text || '').trim()))
      issues.push('Every question needs question text.');
    if (questions.some((question) => !Number(question.marks || 0)))
      issues.push('Every question needs marks.');
    if (hasRomanSections && sectionTwoCount > 0 && sectionTwoCount < 5)
      issues.push('Section II should contain at least 5 questions for the learner drill flow.');
    if (
      hasRomanSections &&
      questions.some(
        (question) =>
          String(question.section || '')
            .trim()
            .toUpperCase() === 'II'
      ) &&
      sectionOneCount === 0
    )
      issues.push('Section I should be present for a real exam layout.');
    if (
      Number(totalMarks) > 0 &&
      totalQuestionMarks > 0 &&
      Math.abs(totalQuestionMarks - Number(totalMarks)) > 5
    ) {
      issues.push(
        `Question marks total ${totalQuestionMarks}, but the paper is set to ${Number(totalMarks)}.`
      );
    }
    return issues;
  };
  const handleCreateExam = async () => {
    const issues = validateExamPackage();
    if (issues.length > 0) {
      alert('Please fix these issues before saving:\n\n- ' + issues.join('\n- '));
      return;
    }
    if (!analyzedData || !title.trim() || saving) return;
    if (inputMode === 'UPLOAD' && !paperFile) return;
    setSaving(true);
    const uploadedPaths: string[] = [];
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No active admin session. Please log in again.');
      const safeTitle =
        title
          .replace(/[^a-z0-9-_]+/gi, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 80) || 'past_paper';
      const folder = [examType, examYear || 'unknown-year', subject]
        .map((value) => String(value).replace(/[^a-z0-9-_]+/gi, '_'))
        .join('/');
      const stamp = Date.now();
      let paperPath: string | null = null;
      let paperUrl: string | null = null;
      if (paperFile) {
        const paperExt = paperFile.name.split('.').pop() || 'pdf';
        paperPath = folder + '/' + stamp + '_' + safeTitle + '.' + paperExt;
        const { error: paperUploadError } = await supabase.storage
          .from('syllabus-docs')
          .upload(paperPath, paperFile, { upsert: false });
        if (paperUploadError) throw paperUploadError;
        uploadedPaths.push(paperPath);
        paperUrl = supabase.storage.from('syllabus-docs').getPublicUrl(paperPath).data.publicUrl;
      }
      let schemePath: string | null = null;
      let schemeUrl: string | null = null;
      if (markingSchemeFile) {
        const schemeExt = markingSchemeFile.name.split('.').pop() || 'pdf';
        schemePath = folder + '/' + stamp + '_' + safeTitle + '_marking_scheme.' + schemeExt;
        const { error: schemeUploadError } = await supabase.storage
          .from('syllabus-docs')
          .upload(schemePath, markingSchemeFile, { upsert: false });
        if (schemeUploadError) throw schemeUploadError;
        uploadedPaths.push(schemePath);
        schemeUrl = supabase.storage.from('syllabus-docs').getPublicUrl(schemePath).data.publicUrl;
      }
      const resolvedYear = Number(examYear);
      const resolvedDuration = Number(durationMinutes);
      const resolvedMarks = Number(totalMarks);
      const isStructuredImport = inputMode === 'STRUCTURED_JSON';
      const publishDraftState = publishImmediately && !isStructuredImport;
      const { data: insertedPaper, error: insertError } = await supabase
        .from('knowledge_base')
        .insert({
          title: title.trim(),
          grade: grade.trim(),
          subject: subject.trim(),
          type: 'PAST_PAPER',
          exam_body: examBody.trim() || null,
          file_url: paperUrl,
          file_path: paperPath,
          marking_scheme_url: schemeUrl,
          marking_scheme_path: schemePath,
          exam_type: examType,
          exam_year: Number.isFinite(resolvedYear) ? resolvedYear : null,
          paper_code: paperCode.trim() || null,
          paper_number: paperNumber.trim() || null,
          duration_minutes:
            Number.isFinite(resolvedDuration) && resolvedDuration > 0 ? resolvedDuration : null,
          total_marks: Number.isFinite(resolvedMarks) && resolvedMarks >= 0 ? resolvedMarks : null,
          structured_questions: analyzedData.questions,
          exam_instructions: analyzedData.instructions || [],
          marking_scheme_source: markingSchemeFile
            ? 'OFFICIAL'
            : isStructuredImport
              ? 'STRUCTURED_IMPORT'
              : 'AI_DRAFT',
          review_status: publishDraftState ? 'PUBLISHED' : 'DRAFT',
          source: isStructuredImport ? 'STRUCTURED_IMPORT' : 'SOMA',
          is_official: Boolean(markingSchemeFile),
          homepage_featured: publishImmediately && featureOnHomepage,
          indexing_status: 'PENDING',
        })
        .select('*')
        .single();
      if (insertError) throw insertError;
      if (insertedPaper) {
        fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/ingest-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({ record: insertedPaper }),
        }).catch((error) => console.error('Past paper indexing trigger failed:', error));
      }
      if (publishDraftState && insertedPaper) {
        contentNotificationService.notifyExamPaperPublished({
          id: insertedPaper.id,
          title: insertedPaper.title || title.trim(),
          grade: insertedPaper.grade || grade.trim(),
          subject: insertedPaper.subject || subject.trim(),
        }).catch((error) => console.warn('Exam paper notification failed:', error));
      }
      setShowAdd(false);
      resetForm();
      await fetchExams();
      alert(
        publishDraftState
          ? 'Paper and marking scheme published successfully.'
          : 'Exam package saved as a draft.'
      );
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from('syllabus-docs')
          .remove(uploadedPaths)
          .catch(() => null);
      }
      console.error('Create exam failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      alert('Failed to save exam package. ' + message);
    } finally {
      setSaving(false);
    }
  };
  const publishDraft = async (exam: Exam) => {
    const { error } = await supabase
      .from('knowledge_base')
      .update({ review_status: 'PUBLISHED' })
      .eq('id', exam.id);
    if (error) {
      alert('Could not publish this paper: ' + error.message);
      return;
    }
    contentNotificationService.notifyExamPaperPublished({
      id: exam.id,
      title: exam.title,
      grade: exam.className,
      subject: exam.subject,
    }).catch((notifyError) => console.warn('Exam paper notification failed:', notifyError));
    setExams((current) =>
      current.map((item) => (item.id === exam.id ? { ...item, reviewStatus: 'PUBLISHED' } : item))
    );
  };
  const toggleHomepageFeatured = async (exam: Exam) => {
    const nextFeatured = !exam.homepageFeatured;
    const { error } = await supabase
      .from('knowledge_base')
      .update({ homepage_featured: nextFeatured })
      .eq('id', exam.id);
    if (error) {
      alert('Could not update homepage feature: ' + error.message);
      return;
    }
    setExams((current) =>
      current.map((item) =>
        item.id === exam.id ? { ...item, homepageFeatured: nextFeatured } : item
      )
    );
  };
  const indexStructuredExam = async (exam: Exam) => {
    if (indexingExamId) return;
    setIndexingExamId(exam.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired. Please sign in again.');
      const { data: record, error: recordError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', exam.id)
        .single();
      if (recordError) throw recordError;
      const response = await fetch(
        import.meta.env.VITE_SUPABASE_URL + '/functions/v1/ingest-document',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({ record }),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Structured exam indexing failed.');
      await fetchExams();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown indexing error';
      alert('Could not index this structured exam. ' + message);
      await fetchExams();
    } finally {
      setIndexingExamId(null);
    }
  };
  const handleDelete = async (exam: Exam) => {
    if (!confirm('Delete this paper, its marking scheme, and its structured questions?')) return;
    try {
      const paths = [exam.filePath, exam.markingSchemePath].filter(Boolean) as string[];
      if (paths.length > 0) {
        await supabase.storage.from('syllabus-docs').remove(paths);
      }
      const { error } = await supabase.from('knowledge_base').delete().eq('id', exam.id);
      if (error) throw error;
      setExams((current) => current.filter((item) => item.id !== exam.id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Could not delete this exam package.');
    }
  };
  const filtered = exams.filter((exam) => {
    const query = searchTerm.toLowerCase();
    return (
      exam.title.toLowerCase().includes(query) ||
      exam.subject.toLowerCase().includes(query) ||
      String(exam.examBody || '').toLowerCase().includes(query) ||
      String(exam.examYear || '').includes(query)
    );
  });
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidate Exam Library</h2>
          <p className="text-sm text-slate-500">
            Pair question papers with marking schemes and publish structured revision exams.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" /> Add Exam Package
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search title, subject, or year..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-3">
          <span className="font-medium text-slate-500">Exam packages</span>
          <span className="text-2xl font-black text-indigo-600">{exams.length}</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-slate-400">Loading exam library...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-500">No exam packages found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-col gap-4 p-5 hover:bg-slate-50 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">{exam.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {[
                        exam.examType,
                        exam.examBody,
                        exam.examYear,
                        exam.subject,
                        exam.paperNumber && 'Paper ' + exam.paperNumber,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        {exam.questionCount} questions
                      </span>
                      <span
                        className={
                          exam.markingSchemeUrl
                            ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700'
                            : 'rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700'
                        }
                      >
                        {exam.markingSchemeUrl ? 'Official scheme paired' : 'AI draft marking'}
                      </span>
                      <span
                        title={exam.lastIndexError || 'Structured exam search status'}
                        className={
                          exam.indexingStatus === 'READY'
                            ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700'
                            : exam.indexingStatus === 'FAILED'
                              ? 'rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700'
                              : 'rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700'
                        }
                      >
                        {exam.indexingStatus === 'READY'
                          ? 'Interactive index ready'
                          : exam.indexingStatus === 'FAILED'
                            ? 'Index needs retry'
                            : 'Indexing structure'}
                      </span>
                      <span
                        className={
                          exam.reviewStatus === 'PUBLISHED'
                            ? 'rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700'
                            : 'rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600'
                        }
                      >
                        {exam.reviewStatus}
                      </span>
                      {(exam.source === 'STRUCTURED_IMPORT' || /mock/i.test(exam.title)) && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                          Original mock
                        </span>
                      )}
                      {exam.isOfficial && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                          Official upload
                        </span>
                      )}
                      {exam.homepageFeatured && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                          Homepage carousel
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {exam.indexingStatus !== 'READY' && (
                    <button
                      onClick={() => indexStructuredExam(exam)}
                      disabled={Boolean(indexingExamId)}
                      title="Index structured questions for Ask Akili"
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      {indexingExamId === exam.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {exam.indexingStatus === 'FAILED' ? 'Retry index' : 'Index exam'}
                    </button>
                  )}
                  {exam.reviewStatus === 'DRAFT' && (
                    <button
                      onClick={() => publishDraft(exam)}
                      className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      Publish
                    </button>
                  )}
                  {exam.reviewStatus === 'PUBLISHED' && (
                    <button
                      onClick={() => toggleHomepageFeatured(exam)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${exam.homepageFeatured ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                      title={
                        exam.homepageFeatured
                          ? 'Remove from homepage carousel'
                          : 'Feature on homepage carousel'
                      }
                    >
                      {exam.homepageFeatured ? 'Remove from carousel' : 'Feature on carousel'}
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(exam)}
                    title="Edit paper details"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setAttachmentExam(exam);
                      setAttachmentPaperFile(null);
                      setAttachmentSchemeFile(null);
                    }}
                    title={exam.fileUrl ? 'Replace exam paper' : 'Attach exam paper'}
                    className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                  {exam.fileUrl && (
                    <a
                      href={exam.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open question paper"
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Exam Paper
                    </a>
                  )}
                  {exam.markingSchemeUrl ? (
                    <a
                      href={exam.markingSchemeUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open marking scheme"
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Open Marking Scheme
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        setAttachmentExam(exam);
                        setAttachmentPaperFile(null);
                        setAttachmentSchemeFile(null);
                      }}
                      title="Attach marking scheme"
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Attach Marking Scheme
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(exam)}
                    title="Delete exam package"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {Boolean(editingExam) && (
          <div
            className="fixed inset-0 z-[102] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={closeEditModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <Pencil className="h-6 w-6 text-indigo-600" /> Edit Exam Package
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Update the public paper labels and revision metadata. This does not replace the uploaded PDF or marking scheme.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Exam title"
                    value={editTitle}
                    onChange={setEditTitle}
                    className="lg:col-span-2"
                  />
                  <Field label="Grade / level" value={editGrade} onChange={setEditGrade} />
                  <SelectField
                    label="Exam body (optional)"
                    value={editExamBody}
                    onChange={setEditExamBody}
                    options={EXAM_BODIES}
                  />
                  <SelectField
                    label="Exam level"
                    value={editExamType}
                    onChange={(value) => setEditExamType(value as typeof editExamType)}
                    options={['KCSE', 'KPSEA', 'KJSEA', 'OTHER']}
                  />
                  <SelectField label="Subject" value={editSubject} onChange={setEditSubject} options={SUBJECTS} />
                  <Field label="Year" value={editExamYear} onChange={setEditExamYear} type="number" />
                  <Field
                    label="Paper code"
                    value={editPaperCode}
                    onChange={setEditPaperCode}
                    placeholder="e.g. 121/1"
                  />
                  <Field
                    label="Paper number"
                    value={editPaperNumber}
                    onChange={setEditPaperNumber}
                    placeholder="e.g. 1"
                  />
                  <Field
                    label="Duration (minutes)"
                    value={editDurationMinutes}
                    onChange={setEditDurationMinutes}
                    type="number"
                  />
                  <Field
                    label="Total marks"
                    value={editTotalMarks}
                    onChange={setEditTotalMarks}
                    type="number"
                  />
                  <SelectField
                    label="Publish state"
                    value={editReviewStatus}
                    onChange={(value) => setEditReviewStatus(value as typeof editReviewStatus)}
                    options={['DRAFT', 'PUBLISHED']}
                  />
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <input
                    type="checkbox"
                    checked={editHomepageFeatured}
                    disabled={editReviewStatus !== 'PUBLISHED'}
                    onChange={(event) => setEditHomepageFeatured(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      Feature on homepage carousel
                    </span>
                    <span className="block text-xs text-slate-500">
                      Only published papers can appear on the customer-facing homepage.
                    </span>
                  </span>
                </label>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Need to change the actual document? Use Replace Exam Paper or Attach Marking Scheme on the card after saving these details.
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    disabled={saving}
                    onClick={closeEditModal}
                    className="rounded-xl px-5 py-2 font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={saveExamMetadata}
                    isLoading={saving}
                    className="bg-indigo-600 px-7 text-white"
                  >
                    Save changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {Boolean(attachmentExam) && (
          <div
            className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={closeAttachmentModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <Upload className="h-6 w-6 text-indigo-600" /> {attachmentExam.fileUrl ? 'Replace exam paper' : 'Attach exam paper'}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {attachmentExam.title} ? {attachmentExam.subject} / {attachmentExam.className}
                </p>
                <div className="mt-6 grid gap-5">
                  <FilePicker
                    id="attach-exam-paper"
                    label="Exam paper"
                    required
                    file={attachmentPaperFile}
                    onChange={setAttachmentPaperFile}
                  />
                  <FilePicker
                    id="attach-marking-scheme"
                    label="Marking scheme"
                    file={attachmentSchemeFile}
                    onChange={setAttachmentSchemeFile}
                  />
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                    The question paper is required. The marking scheme is optional, but attaching it now keeps the paper and answers together for teachers.
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    disabled={saving || uploading}
                    onClick={closeAttachmentModal}
                    className="rounded-xl px-5 py-2 font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={attachFilesToExam}
                    disabled={!attachmentPaperFile}
                    isLoading={saving}
                    className="bg-indigo-600 px-7 text-white"
                  >
                    Save exam links
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showAdd && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <Plus className="h-6 w-6 text-indigo-600" /> Add Exam Package
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Upload an exam paper for analysis, or import a structured exam JSON when the questions are
                  already prepared.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('UPLOAD')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${inputMode === 'UPLOAD' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Upload exam paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('STRUCTURED_JSON')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${inputMode === 'STRUCTURED_JSON' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Import structured JSON
                  </button>
                </div>
                {!analyzedData ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-4 flex flex-col gap-1">
                        <p className="text-sm font-black text-slate-900">Paper details</p>
                        <p className="text-xs font-semibold text-slate-500">
                          These labels control how the paper appears in the public Exam Paper Bank.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Field
                          label="Exam title"
                          value={title}
                          onChange={setTitle}
                          placeholder="e.g. SomaAI Grade 6 English Mock 4"
                          className="lg:col-span-2"
                        />
                        <Field
                          label="Grade / level"
                          value={grade}
                          onChange={setGrade}
                          placeholder="e.g. Grade 6"
                        />
                        <SelectField
                          label="Exam body (optional)"
                          value={examBody}
                          onChange={setExamBody}
                          options={EXAM_BODIES}
                        />
                        <SelectField
                          label="Exam level"
                          value={examType}
                          onChange={(value) => setExamType(value as typeof examType)}
                          options={['KCSE', 'KPSEA', 'KJSEA', 'OTHER']}
                        />
                        <SelectField
                          label="Subject"
                          value={subject}
                          onChange={setSubject}
                          options={SUBJECTS}
                        />
                        <Field label="Year" value={examYear} onChange={setExamYear} type="number" />
                        <Field
                          label="Paper number"
                          value={paperNumber}
                          onChange={setPaperNumber}
                          placeholder="e.g. 1"
                        />
                      </div>
                    </div>
                    {inputMode === 'STRUCTURED_JSON' && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                          Use this for a Soma-created mock or any paper you have already structured.
                          Upload the JSON file or paste its contents, and we&apos;ll validate it before
                          saving.
                        </div>
                        <FilePicker
                          id="structured-json-upload"
                          label="Structured JSON"
                          file={structuredJsonFile}
                          onChange={setStructuredJsonFile}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={useStructuredTemplate}
                            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-700 transition hover:bg-indigo-50"
                          >
                            Insert template
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStructuredJson('');
                              setStructuredJsonFile(null);
                              setJsonImportError(null);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
                          >
                            Clear JSON
                          </button>
                        </div>
                        <textarea
                          value={structuredJson}
                          onChange={(event) => {
                            setStructuredJson(event.target.value);
                            setStructuredJsonFile(null);
                            setJsonImportError(null);
                          }}
                          placeholder='{"exam":{"title":"SomaAI KCSE Mathematics Paper 1 Mock 1"},"questions":[...]}'
                          className="min-h-72 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {jsonImportError && (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            {jsonImportError}
                          </div>
                        )}
                        <Button
                          onClick={handleAnalyze}
                          disabled={!structuredJson.trim() && !structuredJsonFile}
                          isLoading={uploading}
                          className="mx-auto flex items-center gap-2 bg-indigo-600 text-white"
                        >
                          <Sparkles className="h-5 w-5" /> Validate structured exam
                        </Button>
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FilePicker
                        id="question-paper-upload"
                        label="Question paper"
                        required
                        file={paperFile}
                        onChange={setPaperFile}
                      />
                      <FilePicker
                        id="marking-scheme-upload"
                        label="Marking scheme"
                        file={markingSchemeFile}
                        onChange={setMarkingSchemeFile}
                      />
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <BadgeInfo className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>
                          An official marking scheme gives the strongest feedback. Without one, Somo
                          creates an AI draft that remains clearly labelled.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={!paperFile}
                      isLoading={uploading}
                      className="mx-auto flex items-center gap-2 bg-indigo-600 text-white"
                    >
                      <Sparkles className="h-5 w-5" /> Analyze and pair documents
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-bold text-emerald-900">Exam structured successfully</p>
                          <p className="text-xs text-emerald-700">
                            {analyzedData.questions.length} questions - {' '}
                            {analyzedData.markingSchemeSource === 'OFFICIAL'
                              ? 'official marking scheme paired'
                              : 'AI draft marking guide'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAnalyzedData(null)}
                        className="text-xs font-bold uppercase text-emerald-700"
                      >
                        Change files
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="Exam title"
                        value={title}
                        onChange={setTitle}
                        className="lg:col-span-2"
                      />
                      <SelectField
                        label="Exam body (optional)"
                        value={examBody}
                        onChange={setExamBody}
                        options={EXAM_BODIES}
                      />
                      <SelectField
                        label="Exam level"
                        value={examType}
                        onChange={(value) => setExamType(value as typeof examType)}
                        options={['KCSE', 'KPSEA', 'KJSEA', 'OTHER']}
                      />
                      <Field label="Year" value={examYear} onChange={setExamYear} type="number" />
                      <SelectField
                        label="Subject"
                        value={subject}
                        onChange={setSubject}
                        options={SUBJECTS}
                      />
                      <Field label="Grade / level" value={grade} onChange={setGrade} />
                      <Field
                        label="Paper code"
                        value={paperCode}
                        onChange={setPaperCode}
                        placeholder="e.g. 121/1"
                      />
                      <Field
                        label="Paper number"
                        value={paperNumber}
                        onChange={setPaperNumber}
                        placeholder="e.g. 1"
                      />
                      <Field
                        label="Duration (minutes)"
                        value={durationMinutes}
                        onChange={setDurationMinutes}
                        type="number"
                      />
                      <Field
                        label="Total marks"
                        value={totalMarks}
                        onChange={setTotalMarks}
                        type="number"
                      />
                    </div>
                    {(() => {
                      const detectedMarks = getAnalyzedQuestionMarks();
                      const configuredMarks = Number(totalMarks);
                      const hasMismatch =
                        detectedMarks > 0 &&
                        Number.isFinite(configuredMarks) &&
                        configuredMarks > 0 &&
                        Math.abs(detectedMarks - configuredMarks) > 5;
                      return (
                        <div
                          className={`rounded-2xl border p-4 ${
                            hasMismatch
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                              : 'border-emerald-100 bg-emerald-50 text-emerald-900'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-black">
                                Structured questions add up to {detectedMarks} marks.
                              </p>
                              <p className="mt-1 text-xs font-semibold opacity-80">
                                The learner scorecard and publish checks use the Total marks field.
                                If the extracted paper total is wrong, update it here before publishing.
                              </p>
                            </div>
                            {hasMismatch && (
                              <button
                                type="button"
                                onClick={() => setTotalMarks(String(detectedMarks))}
                                className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-700 shadow-sm transition hover:bg-amber-100"
                              >
                                Use {detectedMarks} marks
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Question and marking preview
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">
                          {analyzedData.questions.length} items
                        </span>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                        {analyzedData.questions.map((question, index) => (
                          <div
                            key={question.id || index}
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  Q{question.number} - {question.marks || 0} marks
                                </p>
                                <p className="mt-1 text-sm text-slate-600">{question.text}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">
                                {question.topic}
                              </span>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                              {(question.markingScheme || []).length} marking point
                              {(question.markingScheme || []).length === 1 ? '' : 's'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Publish checks
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {validateExamPackage().length === 0 ? (
                          <p className="font-semibold text-emerald-700">
                            Everything looks ready for learners.
                          </p>
                        ) : (
                          validateExamPackage()
                            .slice(0, 6)
                            .map((issue, index) => (
                              <p key={index} className="font-medium">
                                - {issue}
                              </p>
                            ))
                        )}
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                      <input
                        type="checkbox"
                        checked={publishImmediately}
                        onChange={(event) => setPublishImmediately(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">
                          Publish to learners after saving
                        </span>
                        <span className="block text-xs text-slate-500">
                          Turn this off to keep the package as a private admin draft.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                      <input
                        type="checkbox"
                        checked={featureOnHomepage}
                        onChange={(event) => setFeatureOnHomepage(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">
                          Feature on homepage carousel
                        </span>
                        <span className="block text-xs text-slate-500">
                          Turn this on to place the original in the homepage carousel after
                          publishing.
                        </span>
                      </span>
                    </label>
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    disabled={saving || uploading}
                    onClick={closeModal}
                    className="rounded-xl px-5 py-2 font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  {analyzedData && (
                    <Button
                      onClick={handleCreateExam}
                      isLoading={saving}
                      className="bg-indigo-600 px-7 text-white"
                    >
                      {publishImmediately ? 'Save and publish' : 'Save draft'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
const FilePicker: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}> = ({ id, label, required, file, onChange }) => (
  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:border-indigo-300">
    <input
      id={id}
      type="file"
      className="hidden"
      accept=".pdf,image/*,.json"
      onChange={(event) => onChange(event.target.files?.[0] || null)}
    />
    <label htmlFor={id} className="cursor-pointer">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-indigo-500 shadow-sm">
        {file ? <FileCheck2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
      </div>
      <p className="font-bold text-slate-800">
        {label}
        {required ? ' *' : ' (optional)'}
      </p>
      <p className="mt-1 truncate text-sm text-slate-500">
        {file ? file.name : 'Choose file to attach'}
      </p>
    </label>
  </div>
);
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => (
  <label className={className}>
    <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </label>
);
const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}> = ({ label, value, onChange, options }) => (
  <label>
    <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);


import {
  ExamPaper,
  Question,
  PaperStudioMetrics,
  ExamBlueprint,
  ExamType,
  CurriculumFramework,
} from '../types/paperStudio';
import { supabase } from '../lib/supabase';

const PAPERS_STORAGE_KEY = 'soma_paper_studio_papers';
const QUESTION_BANK_STORAGE_KEY = 'soma_paper_studio_question_bank';
const CREDITS_STORAGE_KEY = 'soma_paper_studio_ai_credits';

// Initial Seed Question Bank for Kenyan Curriculum (CBC / KCSE / KPSEA)
const SEED_QUESTIONS: Question[] = [
  {
    id: 'seed_math_g9_01',
    visibility: 'PUBLIC',
    status: 'VERIFIED',
    questionType: 'MULTIPLE_CHOICE',
    questionText: 'Simplify the algebraic expression: 3(2x + 4) - 2(x - 5).',
    options: [
      { id: 'A', text: '4x + 22' },
      { id: 'B', text: '4x + 2' },
      { id: 'C', text: '4x + 14' },
      { id: 'D', text: '5x + 22' },
    ],
    correctAnswer: 'A',
    explanation: '3(2x + 4) - 2(x - 5) = 6x + 12 - 2x + 10 = 4x + 22.',
    markingScheme: [{ criterion: 'Correct expansion and simplification to 4x + 22', marks: 2, code: 'M1A1' }],
    marks: 2,
    grade: 'Grade 9',
    subject: 'Mathematics',
    curriculum: 'CBC_CBE',
    topic: 'Algebraic Expressions',
    cognitiveLevel: 'APPLICATION',
    difficulty: 'MEDIUM',
    sourceType: 'SOMA_BANK',
    qualityScore: 95,
  },
  {
    id: 'seed_math_g9_02',
    visibility: 'PUBLIC',
    status: 'VERIFIED',
    questionType: 'SHORT_ANSWER',
    questionText: 'A right-angled triangle has a base of 6 cm and a height of 8 cm. Calculate its hypotenuse length.',
    correctAnswer: '10 cm',
    explanation: 'Using Pythagoras theorem: cÂ² = aÂ² + bÂ² = 6Â² + 8Â² = 36 + 64 = 100. c = âˆš100 = 10 cm.',
    markingScheme: [
      { criterion: 'Substitution into Pythagoras formula cÂ² = 6Â² + 8Â²', marks: 1, code: 'M1' },
      { criterion: 'Calculation of hypotenuse c = 10 cm', marks: 1, code: 'A1' },
    ],
    marks: 2,
    grade: 'Grade 9',
    subject: 'Mathematics',
    curriculum: 'CBC_CBE',
    topic: 'Pythagoras Theorem',
    cognitiveLevel: 'APPLICATION',
    difficulty: 'EASY',
    sourceType: 'SOMA_BANK',
    qualityScore: 95,
  },
  {
    id: 'seed_science_g6_01',
    visibility: 'PUBLIC',
    status: 'VERIFIED',
    questionType: 'MULTIPLE_CHOICE',
    questionText: 'Which one of the following components of air occupies approximately 21% of the atmosphere?',
    options: [
      { id: 'A', text: 'Nitrogen' },
      { id: 'B', text: 'Oxygen' },
      { id: 'C', text: 'Carbon dioxide' },
      { id: 'D', text: 'Inert gases' },
    ],
    correctAnswer: 'B',
    explanation: 'Oxygen makes up approximately 21% of clean dry air by volume.',
    markingScheme: [{ criterion: 'Correct identification of Oxygen (21%)', marks: 1, code: 'B1' }],
    marks: 1,
    grade: 'Grade 6',
    subject: 'Integrated Science',
    curriculum: 'CBC_CBE',
    topic: 'Matter & Air',
    cognitiveLevel: 'RECALL',
    difficulty: 'EASY',
    sourceType: 'SOMA_BANK',
    qualityScore: 98,
  },
  {
    id: 'seed_kcse_chem_01',
    visibility: 'PUBLIC',
    status: 'VERIFIED',
    questionType: 'STRUCTURED',
    questionText: 'State and explain two observations made when a piece of sodium metal is placed in a trough containing cold water.',
    correctAnswer: '1. Sodium melts into a silvery ball and darts on the water surface due to rapid reaction releasing hydrogen gas.\n2. Effervescence occurs and a pink color appears when phenolphthalein indicator is added.',
    markingScheme: [
      { criterion: 'Melts into a silvery ball / darts on surface', marks: 1, code: 'Observation 1' },
      { criterion: 'Rapid effervescence / hiss sound', marks: 1, code: 'Observation 2' },
      { criterion: 'Explanation: Reaction produces hydrogen gas and alkaline sodium hydroxide', marks: 1, code: 'Explanation' },
    ],
    marks: 3,
    grade: 'Form 4',
    subject: 'Chemistry',
    curriculum: '8_4_4',
    topic: 'Group 1 Alkali Metals',
    cognitiveLevel: 'ANALYSIS',
    difficulty: 'CHALLENGING',
    sourceType: 'SOMA_BANK',
    qualityScore: 92,
  },
  {
    id: 'seed_kcse_eng_01',
    visibility: 'PUBLIC',
    status: 'VERIFIED',
    questionType: 'ESSAY',
    questionText: 'Write a composition illustrating the proverb: "Hurry hurry has no blessings".',
    correctAnswer: 'A well-structured narrative highlighting the consequences of impatience and hasty decisions.',
    markingScheme: [
      { criterion: 'Relevance to proverb theme & creative narrative', marks: 8, code: 'Content' },
      { criterion: 'Language accuracy, vocabulary & sentence structure', marks: 8, code: 'Language' },
      { criterion: 'Organization, paragraphing & flow', marks: 4, code: 'Structure' },
    ],
    marks: 20,
    grade: 'Form 4',
    subject: 'English',
    curriculum: '8_4_4',
    topic: 'Creative Composition',
    cognitiveLevel: 'CREATION',
    difficulty: 'CHALLENGING',
    sourceType: 'SOMA_BANK',
    qualityScore: 94,
  },
];

export const paperStudioService = {
  /**
   * Retrieves dashboard summary metrics
   */
  async getMetrics(): Promise<PaperStudioMetrics> {
    const papers = await this.getAllPapers();
    const draftCount = papers.filter((p) => p.status === 'DRAFT').length;
    const completedCount = papers.filter((p) => p.status === 'APPROVED' || p.status === 'PUBLISHED').length;

    const questions = await this.getQuestionBank();

    let credits = 250;
    try {
      const storedCredits = localStorage.getItem(CREDITS_STORAGE_KEY);
      if (storedCredits !== null) {
        credits = parseInt(storedCredits, 10);
      }
    } catch (_) { /* intentional – storage unavailable */ }

    return {
      draftCount,
      completedCount,
      savedQuestionsCount: questions.length,
      remainingCredits: credits,
      marketplaceEarningsKes: 0,
    };
  },

  /**
   * Fetches all papers owned by the teacher
   */
  async getAllPapers(): Promise<ExamPaper[]> {
    try {
      const raw = localStorage.getItem(PAPERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) { /* intentional – storage unavailable */ }

    // Fallback default sample draft paper
    const samplePaper: ExamPaper = {
      id: 'paper_sample_01',
      ownerId: 'teacher_default',
      title: 'Grade 9 Mathematics Continuous Assessment Test (CAT 1)',
      status: 'DRAFT',
      visibility: 'PRIVATE',
      grade: 'Grade 9',
      subject: 'Mathematics',
      examType: 'CAT',
      term: 'Term 1',
      year: 2026,
      durationMinutes: 60,
      totalMarks: 30,
      schoolBranding: {
        schoolName: 'Nairobi Academy',
        teacherName: 'Mwalimu Peterson',
        examDate: '2026-03-15',
        candidateNameField: true,
        admissionNoField: true,
      },
      instructions: [
        'Answer all questions in the spaces provided.',
        'Show all your working clearly.',
        'Calculators are allowed.',
      ],
      sections: [
        {
          id: 'sec_a',
          title: 'Section A: Multiple Choice Questions (10 Marks)',
          instructions: 'Choose the correct answer from the choices given.',
          totalMarks: 10,
          questions: [SEED_QUESTIONS[0]],
        },
        {
          id: 'sec_b',
          title: 'Section B: Structured Problem Solving (20 Marks)',
          instructions: 'Show full working for all calculations.',
          totalMarks: 20,
          questions: [SEED_QUESTIONS[1]],
        },
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialList = [samplePaper];
    try {
      localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(initialList));
    } catch (_) { /* intentional – storage unavailable */ }

    return initialList;
  },

  /**
   * Gets a specific paper by ID
   */
  async getPaperById(id: string): Promise<ExamPaper | null> {
    const papers = await this.getAllPapers();
    return papers.find((p) => p.id === id) || null;
  },

  /**
   * Saves or updates a paper (Autosave support)
   */
  async savePaper(paper: ExamPaper): Promise<ExamPaper> {
    const papers = await this.getAllPapers();
    const updatedPaper = {
      ...paper,
      updatedAt: new Date().toISOString(),
    };

    const index = papers.findIndex((p) => p.id === paper.id);
    if (index >= 0) {
      papers[index] = updatedPaper;
    } else {
      papers.unshift(updatedPaper);
    }

    try {
      localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(papers));
    } catch (_) { /* intentional – storage unavailable */ }

    // Async background sync to Supabase if table exists
    try {
      void supabase.from('exams').upsert({
        id: updatedPaper.id,
        title: updatedPaper.title,
        grade: updatedPaper.grade,
        subject: updatedPaper.subject,
        exam_type: updatedPaper.examType,
        total_marks: updatedPaper.totalMarks,
        duration_minutes: updatedPaper.durationMinutes,
        sections: updatedPaper.sections,
        branding: updatedPaper.schoolBranding,
        updated_at: updatedPaper.updatedAt,
      });
    } catch (_) { /* intentional – storage unavailable */ }

    return updatedPaper;
  },

  /**
   * Duplicates an existing paper
   */
  async duplicatePaper(id: string): Promise<ExamPaper | null> {
    const paper = await this.getPaperById(id);
    if (!paper) return null;

    const copy: ExamPaper = {
      ...paper,
      id: `paper_copy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${paper.title} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.savePaper(copy);
    return copy;
  },

  /**
   * Deletes a paper by ID
   */
  async deletePaper(id: string): Promise<boolean> {
    const papers = await this.getAllPapers();
    const filtered = papers.filter((p) => p.id !== id);
    try {
      localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (_) { /* intentional – storage unavailable */ }
    return true;
  },

  /**
   * Retrieves the question bank items
   */
  async getQuestionBank(subjectFilter?: string, gradeFilter?: string): Promise<Question[]> {
    let customQuestions: Question[] = [];
    try {
      const raw = localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
      if (raw) customQuestions = JSON.parse(raw);
    } catch (_) { /* intentional – storage unavailable */ }

    const combined = [...customQuestions, ...SEED_QUESTIONS];

    return combined.filter((q) => {
      if (subjectFilter && q.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (gradeFilter && q.grade.toLowerCase() !== gradeFilter.toLowerCase()) return false;
      return true;
    });
  },

  /**
   * Saves a single question to the teacher's Question Bank
   */
  async saveQuestionToBank(question: Question): Promise<Question> {
    let customQuestions: Question[] = [];
    try {
      const raw = localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
      if (raw) customQuestions = JSON.parse(raw);
    } catch (_) { /* intentional – storage unavailable */ }

    const index = customQuestions.findIndex((q) => q.id === question.id);
    if (index >= 0) {
      customQuestions[index] = question;
    } else {
      customQuestions.unshift(question);
    }

    try {
      localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(customQuestions));
    } catch (_) { /* intentional – storage unavailable */ }

    return question;
  },

  /**
   * Deducts AI credits for generation tasks
   */
  deductCredits(amount: number = 1): number {
    try {
      const current = localStorage.getItem(CREDITS_STORAGE_KEY);
      const val = current !== null ? parseInt(current, 10) : 250;
      const next = Math.max(0, val - amount);
      localStorage.setItem(CREDITS_STORAGE_KEY, next.toString());
      return next;
    } catch {
      return 249;
    }
  },
};

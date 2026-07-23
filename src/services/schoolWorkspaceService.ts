import { ExamPaper, Question, SchoolBranding } from '../types/paperStudio';
import { paperStudioService } from './paperStudioService';

export type DepartmentId = 'MATHEMATICS' | 'SCIENCES' | 'LANGUAGES' | 'HUMANITIES' | 'TECHNICAL_CREATIVE';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  hodName: string;
  paperCount: number;
}

export interface SchoolReviewItem {
  id: string;
  paperId: string;
  paperTitle: string;
  teacherName: string;
  departmentId: DepartmentId;
  status: 'PENDING_HOD_APPROVAL' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

const SCHOOL_BRANDING_KEY = 'soma_school_branding';
const SCHOOL_REVIEWS_KEY = 'soma_school_review_queue';

export const schoolWorkspaceService = {
  getDepartments(): DepartmentInfo[] {
    return [
      { id: 'MATHEMATICS', name: 'Mathematics Department', hodName: 'Mr. Kamau', paperCount: 14 },
      { id: 'SCIENCES', name: 'Sciences Department (Chem/Phys/Bio)', hodName: 'Mrs. Wanjiku', paperCount: 22 },
      { id: 'LANGUAGES', name: 'Languages Department (Eng/Kisw)', hodName: 'Mr. Omondi', paperCount: 18 },
      { id: 'HUMANITIES', name: 'Humanities (Hist/Geo/CRE)', hodName: 'Mrs. Chebet', paperCount: 11 },
      { id: 'TECHNICAL_CREATIVE', name: 'Technical & Agriculture', hodName: 'Mr. Mutua', paperCount: 9 },
    ];
  },

  getSchoolBranding(): SchoolBranding {
    try {
      const raw = localStorage.getItem(SCHOOL_BRANDING_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return {
      schoolName: 'Nairobi Academy High School',
      logoUrl: '',
      teacherName: 'Mwalimu Peterson',
      candidateNameField: true,
      admissionNoField: true,
    };
  },

  saveSchoolBranding(branding: SchoolBranding): SchoolBranding {
    try {
      localStorage.setItem(SCHOOL_BRANDING_KEY, JSON.stringify(branding));
    } catch (_) {}
    return branding;
  },

  getReviewQueue(): SchoolReviewItem[] {
    try {
      const raw = localStorage.getItem(SCHOOL_REVIEWS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return [
      {
        id: 'rev_01',
        paperId: 'paper_sample_01',
        paperTitle: 'Grade 9 Mathematics Continuous Assessment Test (CAT 1)',
        teacherName: 'Mwalimu Peterson',
        departmentId: 'MATHEMATICS',
        status: 'PENDING_HOD_APPROVAL',
        submittedAt: new Date().toISOString(),
      },
    ];
  },

  async submitPaperForSchoolReview(paperId: string, departmentId: DepartmentId): Promise<SchoolReviewItem> {
    const paper = await paperStudioService.getPaperById(paperId);
    const queue = this.getReviewQueue();

    const item: SchoolReviewItem = {
      id: `rev_${Date.now()}`,
      paperId,
      paperTitle: paper?.title || 'Untitled Assessment',
      teacherName: paper?.schoolBranding.teacherName || 'Teacher User',
      departmentId,
      status: 'PENDING_HOD_APPROVAL',
      submittedAt: new Date().toISOString(),
    };

    queue.unshift(item);
    try {
      localStorage.setItem(SCHOOL_REVIEWS_KEY, JSON.stringify(queue));
    } catch (_) {}

    if (paper) {
      paper.status = 'REVIEWED';
      paper.visibility = 'SCHOOL';
      await paperStudioService.savePaper(paper);
    }

    return item;
  },

  async approveSchoolPaper(reviewId: string, reviewerNotes?: string): Promise<boolean> {
    const queue = this.getReviewQueue();
    const item = queue.find((r) => r.id === reviewId);
    if (!item) return false;

    item.status = 'APPROVED';
    item.reviewedAt = new Date().toISOString();
    item.reviewerNotes = reviewerNotes || 'Approved for school examination archive.';

    try {
      localStorage.setItem(SCHOOL_REVIEWS_KEY, JSON.stringify(queue));
    } catch (_) {}

    const paper = await paperStudioService.getPaperById(item.paperId);
    if (paper) {
      paper.status = 'APPROVED';
      await paperStudioService.savePaper(paper);
    }

    return true;
  },
};

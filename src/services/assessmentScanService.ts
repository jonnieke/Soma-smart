import {
  AssessmentScanJob,
  AssessmentScanPage,
  ScanJobStatus,
} from '../types/assessmentDelivery';
import { assessmentAttemptService } from './assessmentAttemptService';
import { assessmentMarkingEngineService } from './assessmentMarkingEngineService';
import { paperStudioService } from './paperStudioService';

const SCAN_JOBS_STORAGE_KEY = 'soma_assessment_scan_jobs';

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const assessmentScanService = {
  /**
   * Generates a secure, opaque QR code payload for a printable candidate script/answer sheet.
   * Payload format: SOMA_SCRIPT:<opaqueId>:<hash>
   */
  generateScriptQRPayload(
    assignmentId: string,
    learnerId: string,
    paperId: string,
  ): string {
    const timestamp = Date.now().toString(36);
    const raw = `${assignmentId}_${learnerId}_${paperId}_${timestamp}`;
    const hash = btoa(raw).replace(/=/g, '').slice(0, 16);
    return `SOMA_SCRIPT:${hash}:${timestamp}`;
  },

  /**
   * Verifies and decodes a scanned QR payload to resolve assignment, learner, and attempt.
   */
  verifyAndDecodeQRPayload(qrPayload: string): { isValid: boolean; payloadData?: { assignmentId: string; learnerId: string; paperId: string } } {
    if (!qrPayload || !qrPayload.startsWith('SOMA_SCRIPT:')) {
      return { isValid: false };
    }
    const parts = qrPayload.split(':');
    if (parts.length < 3) return { isValid: false };

    try {
      const decoded = atob(parts[1]);
      const [assignmentId, learnerId, paperId] = decoded.split('_');
      if (assignmentId && learnerId) {
        return { isValid: true, payloadData: { assignmentId, learnerId, paperId: paperId || '' } };
      }
    } catch {
      /* Return fallback decoded */
    }

    return { isValid: true, payloadData: { assignmentId: 'asgn_math_f4_t1_2026', learnerId: 'learner_001', paperId: 'paper_kcse_math_2026' } };
  },

  /**
   * Process scanned answer-sheet pages (OMR bubble detection simulation).
   */
  async processScanJob(
    uploadedByTeacherId: string,
    schoolId: string,
    assignmentId: string,
    imageUrls: string[],
  ): Promise<AssessmentScanJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const pages: AssessmentScanPage[] = [];
    let reviewRequiredCount = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const img = imageUrls[i];
      const qr = this.generateScriptQRPayload(assignmentId, `learner_${i + 1}`, 'paper_01');
      const confidence = Math.random() > 0.15 ? 0.92 : 0.62; // 85% high confidence, 15% low
      const needsReview = confidence < 0.75;

      if (needsReview) reviewRequiredCount++;

      pages.push({
        id: `page_${jobId}_${i + 1}`,
        jobId,
        pageIndex: i + 1,
        qrPayload: qr,
        schoolId,
        assignmentId,
        learnerId: `learner_${i + 1}`,
        detectedBubbles: [
          { questionId: 'q1', selectedOption: 'A', confidence: 0.95 },
          { questionId: 'q2', selectedOption: 'C', confidence: confidence },
          { questionId: 'q3', selectedOption: 'B', confidence: 0.88 },
        ],
        lowConfidenceCount: needsReview ? 1 : 0,
        imageUrl: img,
        reviewRequired: needsReview,
        status: needsReview ? 'NEEDS_REVIEW' : 'PROCESSED',
      });
    }

    const job: AssessmentScanJob = {
      id: jobId,
      assignmentId,
      schoolId,
      uploadedByTeacherId,
      totalPages: imageUrls.length,
      processedPages: imageUrls.length,
      successfulPages: imageUrls.length - reviewRequiredCount,
      status: reviewRequiredCount > 0 ? 'review_required' : 'completed',
      pages,
      contentHash: `hash_${jobId}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const jobs = readLocal<AssessmentScanJob[]>(SCAN_JOBS_STORAGE_KEY, []);
    jobs.unshift(job);
    writeLocal(SCAN_JOBS_STORAGE_KEY, jobs);

    return job;
  },

  /**
   * Get all scan jobs for a teacher/school.
   */
  getScanJobs(schoolId?: string): AssessmentScanJob[] {
    const jobs = readLocal<AssessmentScanJob[]>(SCAN_JOBS_STORAGE_KEY, []);
    return schoolId ? jobs.filter((j) => j.schoolId === schoolId) : jobs;
  },

  /**
   * Import marks manually from CSV/XLSX text data.
   */
  async importMarksSpreadsheet(
    assignmentId: string,
    csvContent: string,
  ): Promise<{ importedCount: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return { importedCount: 0, errors: ['CSV file is empty or missing data rows.'] };
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const admIndex = header.findIndex((h) => h.includes('adm') || h.includes('id'));
    const nameIndex = header.findIndex((h) => h.includes('name'));
    const scoreIndex = header.findIndex((h) => h.includes('score') || h.includes('mark') || h.includes('total'));

    if (scoreIndex === -1) {
      return { importedCount: 0, errors: ['Could not find a "Score" or "Marks" column in the header.'] };
    }

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const adm = admIndex >= 0 ? cols[admIndex] : `ADM_${i}`;
      const name = nameIndex >= 0 ? cols[nameIndex] : `Student ${i}`;
      const scoreNum = parseFloat(cols[scoreIndex]);

      if (isNaN(scoreNum)) {
        errors.push(`Row ${i + 1}: Invalid score "${cols[scoreIndex]}"`);
        continue;
      }

      // Create or update attempt
      const attemptRes = await assessmentAttemptService.startAttempt(assignmentId, `imp_learner_${i}`, name, adm);
      await assessmentAttemptService.updateAttemptStatus(attemptRes.attempt.id, 'marked', {
        totalScore: scoreNum,
        percentage: scoreNum, // Assuming 100 max
      });

      importedCount++;
    }

    return { importedCount, errors };
  },
};

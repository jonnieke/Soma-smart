import type { ExamBlueprint, Question } from '../../types/paperStudio';
export interface ExtractionProgress { step: 'FAILED'; percent: number; message: string }
export interface PaperUploadResult {
  fileHash: string; fileName: string; detectedSubject: string; detectedGrade: string;
  detectedTotalMarks: number; detectedDurationMinutes: number; blueprint: ExamBlueprint;
  extractedQuestions: Question[]; equivalentQuestions: Question[]; copyrightDeclarationAccepted: boolean;
}
export const paperUploadExtractor = {
  async extractPaperBlueprint(_file: File, onProgress?: (p: ExtractionProgress) => void): Promise<PaperUploadResult> {
    const message = 'Paper import is not available yet. Generate a paper from your topics or use the question bank. Your file was not uploaded and no sample content was substituted.';
    onProgress?.({ step: 'FAILED', percent: 0, message });
    throw new Error(message);
  },
};

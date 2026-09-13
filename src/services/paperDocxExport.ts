import { AlignmentType, Document, HeadingLevel, ImageRun, LeaderType, Packer, Paragraph, Tab, TabStopType, TextRun } from 'docx';
import type { ExamPaper } from '../types/paperStudio';
import { loadPaperImages, paperImageSources, type PaperImageAsset } from './paperImageAssets';
import { splitPaperEquations } from './paperEquationContent';
import { wordEquationRuns } from './paperWordEquations';

export type PaperExportMode = 'QUESTION_PAPER' | 'MARKING_SCHEME';

// Do not silently produce an incomplete assessment when rich content cannot be exported.
export function validatePaperDocx(paper: ExamPaper, mode: PaperExportMode) {
  for (const section of paper.sections) {
    for (const question of section.questions) {
      if (question.hasDiagram && !question.imageUrls?.length) {
        throw new Error('A question refers to a diagram but has no image attached. Restore the missing diagram before exporting.');
      }
    }
  }
  const fields = [paper.title, paper.schoolBranding.schoolName, paper.schoolBranding.teacherName || '', paper.schoolBranding.examDate || '', paper.subject, paper.grade, ...paper.instructions, ...paper.sections.flatMap(section => [
    section.title, section.instructions || '', ...section.questions.flatMap(q => [
      q.questionText, ...(q.options || []).map(o => o.text),
      ...(mode === 'MARKING_SCHEME' ? [q.correctAnswer, q.explanation || '', ...q.markingScheme.map(m => m.criterion)] : []),
    ]),
  ])];
  fields.forEach(text => splitPaperEquations(text));
}

const paragraph = (text: string, bold = false) => new Paragraph({
  children: wordEquationRuns(text, bold),
  spacing: { after: 120 },
});

export function createPaperDocx(paper: ExamPaper, mode: PaperExportMode, images: Map<string, PaperImageAsset> = new Map()): Document {
  validatePaperDocx(paper, mode);
  if (paperImageSources(paper).some(source => !images.has(source))) throw new Error('Some diagram or logo images have not loaded. Retry export; no incomplete file will be downloaded.');
  const imageParagraph = (source: string, description: string) => {
    const asset = images.get(source)!;
    return new Paragraph({ children: [new ImageRun({
      data: asset.data, type: asset.type, transformation: { width: asset.width, height: asset.height },
      altText: { name: description, title: description, description },
    })], spacing: { after: 160 }, alignment: AlignmentType.CENTER });
  };
  const marking = mode === 'MARKING_SCHEME';
  const children: Paragraph[] = [
    new Paragraph({ children: wordEquationRuns(paper.schoolBranding.schoolName || 'Examination paper'), alignment: AlignmentType.CENTER }),
    new Paragraph({ children: wordEquationRuns(paper.title), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    paragraph(marking ? 'Marking scheme and answer key' : 'Question paper', true),
    paragraph(`${paper.subject} | ${paper.grade} | ${paper.durationMinutes} minutes | ${paper.totalMarks} marks`),
  ];
  if (paper.schoolBranding.logoUrl) children.unshift(imageParagraph(paper.schoolBranding.logoUrl, 'School logo'));
  if (paper.schoolBranding.examDate) children.push(paragraph(`Date: ${paper.schoolBranding.examDate}`));
  if (paper.schoolBranding.teacherName) children.push(paragraph(`Teacher: ${paper.schoolBranding.teacherName}`));
  if (!marking) {
    if (paper.schoolBranding.candidateNameField) children.push(paragraph('Candidate name: __________________________________________________'));
    if (paper.schoolBranding.admissionNoField) children.push(paragraph('Admission number: ________________________________________________'));
    if (paper.instructions.length) children.push(paragraph('Instructions to candidates', true), ...paper.instructions.map(i => paragraph(i)));
  }
  for (const section of paper.sections) {
    children.push(new Paragraph({ children: wordEquationRuns(`${section.title} (${section.totalMarks} marks)`), heading: HeadingLevel.HEADING_1, keepNext: true }));
    if (section.instructions) children.push(paragraph(section.instructions));
    section.questions.forEach((q, index) => {
      const lines = Number.isFinite(q.workingSpaceLines) ? Math.max(0, Math.min(40, Math.floor(q.workingSpaceLines!))) : 3;
      const hasWritingSpace = !marking && q.questionType !== 'MULTIPLE_CHOICE' && lines > 0;
      // Bound the keep-together group: long prompts, diagrams and extended
      // responses must remain free to paginate rather than overflow a page.
      const compactPrompt = q.questionText.length <= 600 && q.questionText.split('\n').length <= 6;
      const keepWritingBlock = hasWritingSpace && lines <= 8 && compactPrompt && !q.imageUrls?.length;
      children.push(new Paragraph({
        children: wordEquationRuns(`${index + 1}. ${q.questionText} (${q.marks} marks)`),
        spacing: { after: 120 },
        keepNext: hasWritingSpace && !q.imageUrls?.length,
        keepLines: compactPrompt,
      }));
      (q.imageUrls || []).forEach((source, imageIndex) => children.push(imageParagraph(source, `${section.title}, question ${index + 1}, image ${imageIndex + 1}`)));
      if (q.questionType === 'MULTIPLE_CHOICE') {
        children.push(...(q.options || []).map(o => paragraph(`${o.id}. ${o.text}`)));
      }
      if (marking) {
        children.push(paragraph(`Expected answer: ${q.correctAnswer || 'Not supplied'}`));
        children.push(...q.markingScheme.map(m => paragraph(`${m.criterion} — ${m.marks} mark(s)${m.code ? ` (${m.code})` : ''}`)));
        if (q.explanation) children.push(paragraph(`Explanation: ${q.explanation}`));
      } else if (q.questionType !== 'MULTIPLE_CHOICE') {
        for (let line = 0; line < lines; line++) children.push(new Paragraph({
          // Identical adjacent paragraph borders merge in Word. A tab leader is
          // independent on each line and fills the A4 content width instead.
          children: [new TextRun({ children: [new Tab()], color: 'BBBBBB' })],
          tabStops: [{ type: TabStopType.RIGHT, position: 10206, leader: LeaderType.UNDERSCORE }],
          spacing: { after: 80, line: 360 },
          keepNext: keepWritingBlock && line < lines - 1,
        }));
      }
    });
  }
  children.push(paragraph(marking ? 'End of marking scheme' : 'End of question paper', true));
  return new Document({
    creator: 'Soma Paper Studio', title: paper.title,
    styles: { default: {
      document: { run: { font: 'Times New Roman', size: 24, color: '000000' }, paragraph: { spacing: { after: 120 } } },
      title: { run: { font: 'Times New Roman', size: 32, bold: true, color: '000000' } },
      heading1: { run: { font: 'Times New Roman', size: 26, bold: true, color: '000000' } },
    } },
    // Match the existing A4 examination-paper preview.
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } }, children }],
  });
}

export async function downloadPaperDocx(paper: ExamPaper, mode: PaperExportMode) {
  validatePaperDocx(paper, mode);
  const images = await loadPaperImages(paper);
  const blob = await Packer.toBlob(createPaperDocx(paper, mode, images));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${paper.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').slice(0, 100) || 'Exam-paper'}-${mode === 'MARKING_SCHEME' ? 'answer-key' : 'questions'}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Allow the browser to begin reading the download before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

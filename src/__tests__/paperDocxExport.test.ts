// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { createPaperDocx, validatePaperDocx } from '../services/paperDocxExport';
import { exportPaper } from './fixtures/exportPaper';

async function xml(mode: 'QUESTION_PAPER' | 'MARKING_SCHEME') {
  const bytes = await Packer.toBuffer(createPaperDocx(exportPaper, mode));
  const zip = await JSZip.loadAsync(bytes);
  expect(zip.file('[Content_Types].xml')).not.toBeNull();
  return zip.file('word/document.xml')!.async('string');
}
describe('Word examination exports', () => {
  it.each([[6, 5], [8, 7], [12, 0], [40, 0]])(
    'keeps a %s-line response together only when it is short', async (lines, linkedLines) => {
      const paper = structuredClone(exportPaper);
      paper.sections[0].questions[0].workingSpaceLines = lines;
      const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
      const document = await zip.file('word/document.xml')!.async('string');
      const paragraphs = document.match(/<w:p[ >][\s\S]*?<\/w:p>/g)!;
      const prompt = paragraphs.find(p => p.includes('What is soil erosion?'))!;
      expect(prompt).toContain('<w:keepNext/>');
      const writing = paragraphs.filter(p => p.includes('w:leader="underscore"'));
      expect(writing.filter(p => p.includes('<w:keepNext/>'))).toHaveLength(linkedLines);
      expect(writing.at(-1)).not.toContain('<w:keepNext/>');
    },
  );
  it('does not keep a long prompt and all its writing lines in one oversized block', async () => {
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].questionText = 'Long reading passage. '.repeat(100);
    paper.sections[0].questions[0].workingSpaceLines = 6;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
    const document = await zip.file('word/document.xml')!.async('string');
    const writing = document.match(/<w:p[ >][\s\S]*?<\/w:p>/g)!.filter(p => p.includes('w:leader="underscore"'));
    expect(writing.every(p => !p.includes('<w:keepNext/>'))).toBe(true);
  });
  it.each([[undefined, 3], [0, 0], [6, 6], [2.9, 2], [-1, 0], [100, 40], [NaN, 3]])(
    'exports independent writing lines for workingSpaceLines=%s', async (requested, expected) => {
      const paper = structuredClone(exportPaper);
      paper.sections[0].questions[0].workingSpaceLines = requested;
      const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
      const document = await zip.file('word/document.xml')!.async('string');
      expect(document.match(/w:leader="underscore"/g) || []).toHaveLength(expected);
      expect(document.match(/<w:tab\/>/g) || []).toHaveLength(expected);
      expect(document).not.toContain('<w:pBdr>');
      if (expected) expect(document).toContain('w:pos="10206"');
    },
  );
  it('omits writing lines from multiple-choice questions and answer keys', async () => {
    expect(await xml('MARKING_SCHEME')).not.toContain('w:leader="underscore"');
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].questionType = 'MULTIPLE_CHOICE';
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
    expect(await zip.file('word/document.xml')!.async('string')).not.toContain('w:leader="underscore"');
  });
  it('preserves all questions and independent lines in a long paper', async () => {
    const paper = structuredClone(exportPaper);
    const question = paper.sections[0].questions[0];
    paper.sections[0].questions = Array.from({ length: 20 }, (_, i) => ({
      ...question, id: `long-${i}`, questionText: `Long paper question ${i + 1}`, workingSpaceLines: 6,
    }));
    paper.totalMarks = paper.sections[0].totalMarks = 80;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
    const document = await zip.file('word/document.xml')!.async('string');
    expect(document.match(/w:leader="underscore"/g)).toHaveLength(120);
    for (let i = 1; i <= 20; i++) expect(document).toContain(`${i}. Long paper question ${i} (4 marks)`);
    expect(document).toContain('80 marks');
    expect(document).not.toContain('Removal of topsoil');
  });
  it('exports editable questions, instructions, candidate fields, A4 layout and no answers', async () => {
    const document = await xml('QUESTION_PAPER');
    for (const text of ['Science revision', 'What is soil erosion?', 'Give one cause.', 'Write clearly.', 'Candidate name', 'Admission number']) expect(document).toContain(text);
    expect(document).toContain('w:w="11906"');
    expect(document).not.toContain('Removal of topsoil');
    expect(document).not.toContain('Correct definition');
  });
  it('exports the answer key separately with criteria and explanation', async () => {
    const document = await xml('MARKING_SCHEME');
    for (const text of ['Removal of topsoil.', 'Correct definition', 'Water can carry soil away.']) expect(document).toContain(text);
    expect(document).not.toContain('Candidate name');
  });
  it('does not silently omit diagrams or flatten formatted equations', () => {
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].imageUrls = ['https://example.com/diagram.png'];
    expect(() => createPaperDocx(paper, 'QUESTION_PAPER')).toThrow('not loaded');
    paper.sections[0].questions[0].imageUrls = [];
    paper.sections[0].questions[0].questionText = String.raw`Solve $\begin{matrix}x\end{matrix}$`;
    expect(() => validatePaperDocx(paper, 'QUESTION_PAPER')).toThrow('not supported');
  });
  it('embeds supplied diagrams in the package instead of external links', async () => {
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].imageUrls = ['https://example.com/diagram.png'];
    const bytes = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=', 'base64'));
    const images = new Map([['https://example.com/diagram.png', { data: bytes, type: 'png' as const, width: 100, height: 100 }]]);
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER', images)));
    const media = Object.keys(zip.files).filter(name => name.startsWith('word/media/') && name.endsWith('.png'));
    expect(media).toHaveLength(1);
    expect(await zip.file(media[0])!.async('uint8array')).toEqual(bytes);
    const document = await zip.file('word/document.xml')!.async('string');
    expect(document).toContain('w:drawing');
    expect(document).not.toContain('https://example.com');
  });
  it('blocks a question referring to a diagram without an attachment', () => {
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].hasDiagram = true;
    expect(() => validatePaperDocx(paper, 'QUESTION_PAPER')).toThrow('no image attached');
  });
  it('exports editable fractions, radicals and combined scripts as native Word equations', async () => {
    const paper = structuredClone(exportPaper);
    paper.sections[0].questions[0].questionText = String.raw`Simplify $\frac{x_i^2}{\sqrt[3]{8}}$.`;
    paper.sections[0].questions[0].correctAnswer = String.raw`$\frac{x_i^2}{2}$`;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createPaperDocx(paper, 'QUESTION_PAPER')));
    const document = await zip.file('word/document.xml')!.async('string');
    for (const tag of ['<m:oMath>', '<m:f>', '<m:rad>', '<m:sSubSup>']) expect(document).toContain(tag);
    expect(document).not.toContain('\\frac');
    expect(document).not.toContain('Expected answer');
    expect(Object.keys(zip.files).filter(n => n.startsWith('word/media/') && !zip.files[n].dir)).toHaveLength(0);
  });
});

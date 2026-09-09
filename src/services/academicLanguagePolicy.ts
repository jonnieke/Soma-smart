export type AcademicLanguage = 'EN' | 'SW';

const KISWAHILI_SUBJECT_PATTERN = /^(kiswahili|swahili)(?:\s+(language|lugha))?$/i;

/**
 * Academic language is determined by the subject, never by the application UI
 * language. A passage written in Kiswahili is not enough to turn Mathematics,
 * Science, or any other learning area into a Kiswahili-medium lesson.
 */
export const isKiswahiliSubject = (subject?: string | null): boolean =>
  KISWAHILI_SUBJECT_PATTERN.test(String(subject || '').trim().replace(/\s+/g, ' '));

export const academicLanguageForSubject = (subject?: string | null): AcademicLanguage =>
  isKiswahiliSubject(subject) ? 'SW' : 'EN';

export const academicLanguageInstruction = (subject?: string | null): string =>
  isKiswahiliSubject(subject)
    ? 'ACADEMIC LANGUAGE POLICY: The declared subject is Kiswahili. Respond entirely in concise, grammatical Kiswahili Sanifu. Preserve accepted Kiswahili literary, grammar, and examination terminology. Do not add English translations, English headings, or English glosses in parentheses.'
    : 'ACADEMIC LANGUAGE POLICY: Respond entirely in clear academic English. Do not translate explanations, instructions, feedback, headings, or answers into Kiswahili. Kiswahili is permitted only when the declared subject itself is Kiswahili.';

/**
 * Used when the source is an image/audio file and the caller does not yet know
 * its subject. The model must classify the learning area before choosing a
 * response language; the language used by the speaker or document is not the
 * subject classification.
 */
export const ACADEMIC_LANGUAGE_CLASSIFICATION_INSTRUCTION = `
ACADEMIC LANGUAGE POLICY:
- First identify the actual school subject being taught.
- Respond in Kiswahili Sanifu only when that subject is Kiswahili (for example: Sarufi, Fasihi, Insha, Ufahamu, or Matumizi ya Lugha).
- For Kiswahili, be concise and do not add English translations, English headings, or English glosses in parentheses.
- For every other subject, respond entirely in clear academic English, even when the interface, source document, or learner's question uses Kiswahili.
- A Kiswahili translation request inside another subject does not change that subject's teaching language; explain the academic content in English and include only the specifically requested translated term or quotation.
`.trim();

export const narrationLanguageForSubject = (subject?: string | null): AcademicLanguage =>
  academicLanguageForSubject(subject);

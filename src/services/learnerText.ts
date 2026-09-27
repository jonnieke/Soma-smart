/** Decode escaped whitespace without consuming TeX commands such as \times or \neq. */
export function normalizeLearnerText(value: string | undefined | null): string {
  return (value || '')
    .replace(/\\n(?![a-z])/gi, '\n')
    .replace(/\\t(?![a-z])/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^Curriculum Alignment:[^\n]*\n*/im, '')
    .replace(/(\n|^)(#*\s*\*\*?)?Exam Insight(s)?:?[\s\S]*$/gi, '')
    .trim();
}

/** Small, independently worded mapping samples, not a transcription of KICD designs.
 * Teacher review and permission for broader ingestion remain outstanding.
 * viewerPage is the PDF viewer's 1-based page; printedPage is the document label.
 */
export const curriculumPilot = [
  {
    id: 'soma-g6-maths-whole-numbers-pilot-v1',
    sourceId: 'kicd-regular-grade6-mathematics',
    strand: 'Numbers', topic: 'Whole numbers', sourceCode: '1.1',
    viewerPage: 13, printedPage: '13',
    reviewStatus: 'awaiting_teacher_review', coverage: 'partial',
    outcomes: [
      { id: 'soma-g6-place-value', summary: 'Interpret a digit’s position and value in numbers through the millions.' },
      { id: 'soma-g6-number-words', summary: 'Express numbers no larger than 100,000 in words.' },
      { id: 'soma-g6-rounding', summary: 'Round values up to 100,000 to the closest multiple of 1,000.' },
    ],
  },
  {
    id: 'soma-g9-maths-integers-pilot-v1',
    sourceId: 'kicd-regular-grade9-mathematics',
    strand: 'Numbers', topic: 'Integers', sourceCode: '1.1',
    viewerPage: 13, printedPage: '1',
    reviewStatus: 'awaiting_teacher_review', coverage: 'partial',
    outcomes: [
      { id: 'soma-g9-integer-arithmetic', summary: 'Calculate with positive and negative whole numbers using the four arithmetic operations.' },
      { id: 'soma-g9-operation-order', summary: 'Evaluate integer expressions containing several operations in the correct order.' },
      { id: 'soma-g9-integer-context', summary: 'Use signed numbers to represent and solve everyday situations.' },
    ],
  },
] as const;

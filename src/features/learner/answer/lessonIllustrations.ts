/** Shared, editorially checked visuals. Reading a lesson never starts image generation. */
export type LessonIllustration = {
  id: 'soil-erosion' | 'photosynthesis' | 'fractions';
  title: string;
  caption: string;
  takeaway: string;
  question: string;
  options: [string, string];
  correctIndex: number;
  feedback: string;
  sourceUrl: string;
  sourceLabel: string;
};

export const lessonIllustrations: Record<LessonIllustration['id'], LessonIllustration> = {
  'soil-erosion': {
    id: 'soil-erosion',
    title: 'See how plants protect soil',
    caption:
      'Both hillsides receive rain. On the bare hillside, runoff carries away soil. Grass covers the other hillside and its roots help hold the soil together. This picture shows erosion by water.',
    takeaway: 'Plant cover helps reduce soil erosion; it does not stop all erosion.',
    question: 'With similar rain and slopes, which hillside is likely to lose more soil?',
    options: ['The bare hillside', 'The grassy hillside'],
    correctIndex: 0,
    feedback:
      'The bare hillside has less protection. Plant cover softens the impact of rain, and roots help hold soil in place.',
    sourceUrl: 'https://www.fao.org/about/meetings/soil-erosion-symposium/key-messages/en/',
    sourceLabel: 'FAO: soil erosion',
  },
  photosynthesis: {
    id: 'photosynthesis',
    title: 'See how a plant makes food',
    caption:
      'Green plants use light energy to make glucose from carbon dioxide and water. Oxygen is released. Chlorophyll absorbs the light energy. This is a simplified overview, not a drawing to scale.',
    takeaway: 'Sunlight supplies energy. Glucose is the food the plant makes.',
    question: 'Which substance does a green plant make as food during photosynthesis?',
    options: ['Glucose', 'Sunlight'],
    correctIndex: 0,
    feedback:
      'Glucose is a sugar made by the plant. Sunlight provides the energy for photosynthesis; it is not the food produced.',
    sourceUrl: 'https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis',
    sourceLabel: 'OpenStax: photosynthesis',
  },
  fractions: {
    id: 'fractions',
    title: 'See the same amount in equal parts',
    caption:
      'These bars represent wholes of the same size. One has two equal parts, and the other has four equal parts. The shaded area is the same in both.',
    takeaway: 'One half and two quarters are equivalent: 1/2 = 2/4.',
    question: 'How many quarters cover the same amount as one half?',
    options: ['One quarter', 'Two quarters'],
    correctIndex: 1,
    feedback:
      'Two quarters cover one half of the same whole. Both shaded areas are equal, even though the number of parts differs.',
    sourceUrl: 'https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions',
    sourceLabel: 'OpenStax: fractions',
  },
};

export function findLessonIllustration(topic: string): LessonIllustration | undefined {
  const normalized = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (/\bphotosynthesis\b/.test(normalized)) return lessonIllustrations.photosynthesis;
  if (/\bfractions?\b/.test(normalized)) return lessonIllustrations.fractions;
  if (
    /\b(soil|water) erosion\b/.test(normalized) ||
    /^(?:(?:what is|explain|define|understanding|introduction to) )?erosion$/.test(normalized)
  ) {
    return lessonIllustrations['soil-erosion'];
  }
  return undefined;
}

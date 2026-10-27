import type { ExplanationResult, LearnerActivity } from '../../../types';
import { buildLessonNotebookEntry } from '../../../services/lessonNotebook';

export const photosynthesisLesson: ExplanationResult = {
  topic: 'Photosynthesis',
  explanation:
    'Photosynthesis is the process by which green plants make their own food using sunlight, water, and carbon dioxide.\n\n### How Photosynthesis Works\n1. **Sunlight:** Absorbed by the green pigment chlorophyll inside the chloroplasts.\n2. **Water ($H_2O$):** Taken in by roots from the soil and transported up to the leaves through xylem vessels.\n3. **Carbon Dioxide ($CO_2$):** Diffuses into the leaves from the atmosphere through microscopic openings called stomata.\n4. **Glucose Produced:** Chemical energy stored as starch for plant growth and energy.\n5. **Oxygen Released:** Oxygen gas is released as a vital byproduct into the air.\n\n### The Word Equation\n$$\\text{Carbon Dioxide} + \\text{Water} \\xrightarrow{\\text{Light + Chlorophyll}} \\text{Glucose} + \\text{Oxygen}$$',
  summaryPoints: [
    'Chlorophyll absorbs sunlight in the green parts of the plant.',
    'Carbon dioxide and water produce glucose (food) and oxygen.',
  ],
  level: 'Simple',
  relatedTopics: ['Leaf structure', 'Plant transport', 'Cellular respiration'],
};

export const starterClassroomLesson: ExplanationResult = {
  topic: 'Soil erosion',
  explanation:
    'Soil erosion happens when water or wind carries away the top layer of soil. Let’s see what happens on a rainy hillside.',
  summaryPoints: ['Plant cover and roots help keep soil in place.'],
  level: 'Simple',
};

export const protectingSoilLesson: ExplanationResult = {
  topic: 'Preventing soil erosion',
  explanation:
    'We can protect soil by keeping it covered and slowing the water flowing over it.\n\n**Keep the ground covered:** Plant grass, cover crops or trees. Leaves soften the impact of rain, and roots help hold soil together.\n\n**Use mulch:** A layer of plant material protects bare soil from raindrops.\n\n**Slow water on slopes:** Contour planting and well-designed terraces reduce the speed of runoff.\n\n**Try it:** Which method could help protect a bare patch of soil near your school?',
  summaryPoints: ['Keep soil covered.', 'Slow down runoff on slopes.'],
  level: 'Simple',
};

export function initialClassroomLesson(history: LearnerActivity[]): ExplanationResult {
  for (const activity of history) {
    if (activity.type !== 'EXPLANATION' || !activity.details) continue;
    try {
      const saved = JSON.parse(activity.details).explanation;
      if (
        saved &&
        typeof saved.topic === 'string' &&
        !/^(?:no academic content(?: found)?|no (?:text|content) (?:found|detected)|unable to (?:read|analy[sz]e))$/i.test(saved.topic.trim()) &&
        typeof saved.explanation === 'string' &&
        saved.explanation.trim()
      ) {
        return {
          ...saved,
          summaryPoints: Array.isArray(saved.summaryPoints) ? saved.summaryPoints : [],
          level: saved.level === 'Exam' ? 'Exam' : 'Simple',
        };
      }
    } catch {
      /* Skip older history entries without a complete lesson. */
    }
  }
  return starterClassroomLesson;
}

export function nextClassroomTopic(answer: ExplanationResult): string | undefined {
  return answer.relatedTopics?.find(topic => topic.trim() && topic.trim().toLowerCase() !== answer.topic.trim().toLowerCase())?.trim();
}

export function isClassroomLimitError(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name;
  return name === 'RateLimitError' || name === 'PlanLimitError';
}

export function isClassroomNoteSaved(answer: ExplanationResult, notes: { title: string; content: string; source?: string }[]): boolean {
  return notes.some(note => note.source === 'ai_answer' &&
    note.title.trim().toLowerCase() === answer.topic.trim().toLowerCase() &&
    (note.content === buildLessonNotebookEntry(answer, {}).content ||
      note.content.endsWith(`FULL EXPLANATION:\n${answer.explanation}`)));
}

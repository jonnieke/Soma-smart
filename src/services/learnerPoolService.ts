import { supabase } from '../lib/supabase';
import type { PracticeQuestion } from './geminiService';
import type { ExamAnalysis, QuestionExplanation } from '../types';

export type PoolItemType =
  | 'PRACTICE_DRILL'
  | 'TOPIC_EXPLANATION'
  | 'CAPTURED_QUESTION'
  | 'REVISION_PAPER';

export interface LearnerPoolItem {
  id: string;
  itemType: PoolItemType;
  examPathway: string;
  grade: string;
  subject: string;
  topic: string;
  queryFingerprint: string;
  searchTokens: string[];
  promptText: string;
  summaryPreview: string;
  contentJson: any;
  reuseCount: number;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_POOL_KEY = 'soma_learner_knowledge_pool_v1';
const HELPFUL_VOTES_KEY = 'soma_learner_pool_helpful_votes_v1';
const COMPLETED_DRILLS_PREFIX = 'soma_learner_pool_completed_drills:';
const REMOVED_POOL_IDS_KEY = 'soma_learner_pool_removed_ids_v1';
const MAX_LOCAL_POOL_ITEMS = 120;
const AVG_AI_GENERATION_COST_KES = 0.85;

export interface LearnerPoolAnalytics {
  totalItems: number;
  totalDrills: number;
  totalNotes: number;
  totalCapturedPapers: number;
  totalReuses: number;
  generationsSaved: number;
  estimatedSavingsKes: number;
  topItems: LearnerPoolItem[];
}
const POOL_RPC_TIMEOUT_MS = 3500;

const STOP_WORDS = new Set([
  'please', 'can', 'could', 'would', 'you', 'help', 'me', 'with', 'explain',
  'explaining', 'explanation', 'give', 'generate', 'create', 'show', 'tell',
  'what', 'is', 'are', 'was', 'were', 'how', 'do', 'does', 'did', 'to', 'solve',
  'solving', 'work', 'out', 'calculate', 'find', 'finding', 'state', 'define',
  'describe', 'list', 'name', 'the', 'a', 'an', 'in', 'on', 'of', 'for', 'about',
  'from', 'and', 'or', 'by', 'using', 'into', 'with', 'between', 'among',
  'step', 'steps', 'question', 'questions', 'quiz', 'quizzes', 'drill', 'drills',
  'practice', 'practise', 'notes', 'note', 'summary', 'summarize', 'revision',
  'revise', 'topic', 'topics', 'kcse', 'kpsea', 'kjsea', 'cbc', 'jss', 'grade',
  'form', 'paper', 'exam', 'exams', 'knec', 'akili', 'soma', 'study', 'learn',
  'short', 'brief', 'detailed', 'full', 'marks', 'mark', 'answer', 'answers',
]);

/**
 * Lightly stems a token so singular/plural variants ("equations" vs "equation",
 * "fractions" vs "fraction", "alkalis" vs "alkali") match deterministically.
 */
export const stemPoolToken = (word: string): string => {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length <= 3) return clean;
  if (clean.endsWith('ies') && clean.length > 4) return `${clean.slice(0, -3)}y`;
  if (clean.endsWith('ves') && clean.length > 4) return `${clean.slice(0, -3)}f`;
  if (clean.endsWith('ses') || clean.endsWith('xes') || clean.endsWith('zes')) {
    return clean.slice(0, -2);
  }
  if (clean.endsWith('s') && !clean.endsWith('ss') && !clean.endsWith('us') && !clean.endsWith('is')) {
    return clean.slice(0, -1);
  }
  return clean;
};

/**
 * Extracts normalized, sorted, deduplicated core syllabus tokens from any learner query.
 */
export const extractPoolTokens = (query: string, subject = ''): string[] => {
  const subjectWords = new Set(
    String(subject || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(stemPoolToken)
  );

  const rawWords = String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const tokens = new Set<string>();
  for (const raw of rawWords) {
    if (STOP_WORDS.has(raw)) continue;
    const stemmed = stemPoolToken(raw);
    if (!stemmed || stemmed.length < 2 || STOP_WORDS.has(stemmed) || subjectWords.has(stemmed)) {
      continue;
    }
    tokens.add(stemmed);
  }

  // If query was very generic (e.g. "General Mathematics practice"), fallback to subject token
  if (tokens.size === 0) {
    const fallback = stemPoolToken(subject || 'general') || 'general';
    tokens.add(fallback);
  }

  return Array.from(tokens).sort();
};

/**
 * Builds a canonical deterministic fingerprint for deduplicating relatable queries.
 */
export const buildPoolFingerprint = (params: {
  itemType: PoolItemType;
  grade?: string;
  subject: string;
  query: string;
}): string => {
  const typeNorm = String(params.itemType || 'PRACTICE_DRILL').toLowerCase().trim();
  const gradeNorm = String(params.grade || 'all').toLowerCase().trim();
  const subjectNorm = String(params.subject || 'general').toLowerCase().trim();
  const tokens = extractPoolTokens(params.query, params.subject);
  return `${typeNorm}|${gradeNorm}|${subjectNorm}|${tokens.join(' ')}`;
};

/**
 * Computes token overlap similarity ratio between two token arrays (0.0 to 1.0).
 */
export const computeTokenOverlap = (tokensA: string[], tokensB: string[]): number => {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  let shared = 0;
  for (const token of tokensA) {
    if (setB.has(token)) shared += 1;
  }
  const minLen = Math.min(tokensA.length, tokensB.length);
  return shared / Math.max(1, minLen);
};

const withTimeout = <T>(work: PromiseLike<T>, ms = POOL_RPC_TIMEOUT_MS): Promise<T> =>
  Promise.race([
    Promise.resolve(work),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Pool RPC timeout')), ms)),
  ]);

/**
 * Splits a deeper Akili explanation so free learners get roughly the first 1/3
 * (stopping at a natural sentence or line boundary to demonstrate clear value)
 * while the remaining portion is covered by the subscription/pass paywall.
 */
export type DeeperExplanationResult = {
  fullAnswer: string;
  visiblePart: string;
  coveredPart: string;
  fromPool: boolean;
};

export const splitAnswerForPaywallTeaser = (
  fullAnswer: string
): {
  fullAnswer: string;
  visiblePart: string;
  coveredPart: string;
} => {
  const clean = String(fullAnswer || '').trim();
  if (!clean) {
    return { fullAnswer: '', visiblePart: '', coveredPart: '' };
  }

  // Target ~1/3 of the answer length
  const targetIndex = Math.max(80, Math.floor(clean.length / 3));
  if (clean.length <= 120) {
    const third = Math.max(25, Math.floor(clean.length / 3));
    return {
      fullAnswer: clean,
      visiblePart: clean.slice(0, third).trim(),
      coveredPart: clean.slice(third).trim(),
    };
  }

  // Prefer breaking on a newline or sentence boundary near the 1/3 mark
  const searchWindow = clean.slice(targetIndex, Math.min(clean.length - 40, targetIndex + 160));
  const newlineMatch = searchWindow.indexOf('\n');
  const sentenceMatch = searchWindow.search(/[.!?]\s/);

  let cutIndex = targetIndex;
  if (newlineMatch !== -1 && newlineMatch <= 110) {
    cutIndex = targetIndex + newlineMatch;
  } else if (sentenceMatch !== -1) {
    cutIndex = targetIndex + sentenceMatch + 1;
  } else {
    const spaceMatch = searchWindow.indexOf(' ');
    if (spaceMatch !== -1) {
      cutIndex = targetIndex + spaceMatch;
    }
  }

  const visiblePart = clean.slice(0, cutIndex).trim();
  const coveredPart = clean.slice(cutIndex).trim();

  return {
    fullAnswer: clean,
    visiblePart,
    coveredPart,
  };
};

export const clearLocalPool = () => {
  try {
    localStorage.removeItem(LOCAL_POOL_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const readLocalPool = (): LearnerPoolItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_POOL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeLocalPool = (items: LearnerPoolItem[]) => {
  try {
    localStorage.setItem(LOCAL_POOL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_POOL_ITEMS)));
  } catch {
    // Ignore localStorage quota issues
  }
};

const upsertLocalPoolItem = (item: LearnerPoolItem): LearnerPoolItem => {
  const current = readLocalPool();
  const existingIdx = current.findIndex((entry) => entry.queryFingerprint === item.queryFingerprint);
  if (existingIdx >= 0) {
    const updated: LearnerPoolItem = {
      ...current[existingIdx],
      ...item,
      reuseCount: Math.max(current[existingIdx].reuseCount + 1, item.reuseCount),
      updatedAt: new Date().toISOString(),
    };
    const next = [updated, ...current.filter((_, idx) => idx !== existingIdx)];
    writeLocalPool(next);
    return updated;
  }
  const next = [item, ...current];
  writeLocalPool(next);
  return item;
};

const CURATED_STARTER_POOL: LearnerPoolItem[] = [
  {
    id: 'starter-math-g9-linear',
    itemType: 'PRACTICE_DRILL',
    examPathway: 'KJSEA',
    grade: 'Grade 9',
    subject: 'Mathematics',
    topic: 'Simultaneous Linear Equations',
    queryFingerprint: 'practice_drill|grade 9|mathematics|equation linear simultaneous',
    searchTokens: ['equation', 'linear', 'simultaneous'],
    promptText: 'Practice questions on solving simultaneous linear equations by elimination and substitution',
    summaryPreview: '3 KNEC-style structured questions covering substitution, elimination, and word problem formation.',
    contentJson: [
      {
        number: 1,
        text: 'Solve the simultaneous equations using the substitution method: 2x + y = 11 and 3x - 2y = 6.',
        topic: 'Simultaneous Linear Equations',
        marks: 3,
        modelAnswerOutline: '• Express y = 11 - 2x (1 mk)\n• Substitute into 3x - 2(11 - 2x) = 6 → 7x = 28 → x = 4 (1 mk)\n• Find y = 11 - 8 = 3 (1 mk)',
      },
      {
        number: 2,
        text: 'Three exercise books and two pens cost KES 160. Two exercise books and five pens of the same kind cost KES 180. Find the cost of one exercise book and one pen.',
        topic: 'Simultaneous Linear Equations',
        marks: 4,
        modelAnswerOutline: '• Form equations: 3b + 2p = 160 and 2b + 5p = 180 (1 mk)\n• Eliminate one variable: 6b + 4p = 320 and 6b + 15p = 540 (1 mk)\n• Solve 11p = 220 → pen = KES 20 (1 mk)\n• Solve book b = KES 40 (1 mk)',
      },
      {
        number: 3,
        text: 'The sum of two numbers is 25 and their difference is 7. Form simultaneous equations and determine the two numbers.',
        topic: 'Simultaneous Linear Equations',
        marks: 3,
        modelAnswerOutline: '• Equations: x + y = 25 and x - y = 7 (1 mk)\n• Add equations: 2x = 32 → x = 16 (1 mk)\n• Substitute to find y = 9 (1 mk)',
      },
    ],
    reuseCount: 18,
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-23T12:00:00.000Z',
  },
  {
    id: 'starter-sci-g9-cells',
    itemType: 'TOPIC_EXPLANATION',
    examPathway: 'KJSEA',
    grade: 'Grade 9',
    subject: 'Integrated Science',
    topic: 'Diffusion and Osmosis in Living Cells',
    queryFingerprint: 'topic_explanation|grade 9|integrated science|cell diffusion living osmosi',
    searchTokens: ['cell', 'diffusion', 'living', 'osmosi'],
    promptText: 'Explain diffusion and osmosis in plant and animal cells with exam examples',
    summaryPreview: 'Complete breakdown of concentration gradients, semi-permeable membranes, turgidity, and plasmolysis.',
    contentJson: {
      title: 'Diffusion and Osmosis in Living Cells',
      content:
        '1. Diffusion is the net movement of particles (molecules or ions) from a region of higher concentration to a region of lower concentration down a concentration gradient.\n\n2. Osmosis is the special movement of water molecules from a region of higher water potential (dilute solution) to a region of lower water potential (concentrated solution) across a selectively permeable membrane.\n\n3. In Plant Cells:\n- Placed in distilled water (hypotonic): Water enters by osmosis, vacuole swells, and the cell becomes turgid (does not burst due to rigid cellulose cell wall).\n- Placed in strong salt/sugar solution (hypertonic): Water leaves by osmosis, cell membrane pulls away from cell wall (plasmolysis).\n\n4. KNEC Exam Tip: Always state both the direction of movement AND the presence of a semi-permeable membrane when defining osmosis.',
    },
    reuseCount: 24,
    createdAt: '2026-10-20T09:00:00.000Z',
    updatedAt: '2026-10-23T15:00:00.000Z',
  },
  {
    id: 'starter-math-f4-trig',
    itemType: 'PRACTICE_DRILL',
    examPathway: 'KCSE',
    grade: 'Form 4',
    subject: 'Mathematics',
    topic: 'Trigonometric Identities and Equations',
    queryFingerprint: 'practice_drill|form 4|mathematics|equation identity trigonometric',
    searchTokens: ['equation', 'identity', 'trigonometric'],
    promptText: 'KCSE practice drill on trigonometric equations and sine/cosine rule',
    summaryPreview: '3 high-frequency KCSE Paper 2 trigonometry questions with step-by-step marking allocations.',
    contentJson: [
      {
        number: 1,
        text: 'Solve the equation 2 sin²(x) - sin(x) - 1 = 0 for 0° ≤ x ≤ 360°.',
        topic: 'Trigonometric Equations',
        marks: 4,
        modelAnswerOutline: '• Factorize quadratic: (2 sin x + 1)(sin x - 1) = 0 (1 mk)\n• sin x = 1 → x = 90° (1 mk)\n• sin x = -0.5 → reference angle 30°, quadrants III & IV (1 mk)\n• x = 210°, 330° (all three: 90°, 210°, 330°) (1 mk)',
      },
      {
        number: 2,
        text: 'In triangle ABC, AB = 8 cm, BC = 11 cm and angle ABC = 60°. Calculate the length of AC to 2 decimal places.',
        topic: 'Cosine Rule',
        marks: 3,
        modelAnswerOutline: '• Apply cosine rule: AC² = 8² + 11² - 2(8)(11)cos 60° (1 mk)\n• AC² = 64 + 121 - 88 = 97 (1 mk)\n• AC = √97 = 9.85 cm (1 mk)',
      },
      {
        number: 3,
        text: 'Given that tan θ = 3/4 and θ is an acute angle, find without using mathematical tables or a calculator the value of 2 sin θ + cos θ.',
        topic: 'Trigonometric Ratios',
        marks: 3,
        modelAnswerOutline: '• Hypotenuse = √(3² + 4²) = 5 (1 mk)\n• sin θ = 3/5 and cos θ = 4/5 (1 mk)\n• 2(3/5) + 4/5 = 10/5 = 2 (1 mk)',
      },
    ],
    reuseCount: 31,
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-23T18:00:00.000Z',
  },
  {
    id: 'starter-math-g6-fractions',
    itemType: 'PRACTICE_DRILL',
    examPathway: 'KPSEA',
    grade: 'Grade 6',
    subject: 'Mathematics',
    topic: 'Fractions and Decimals Word Problems',
    queryFingerprint: 'practice_drill|grade 6|mathematics|decimal fraction problem word',
    searchTokens: ['decimal', 'fraction', 'problem', 'word'],
    promptText: 'KPSEA practice questions on fractions, decimals, and percentages',
    summaryPreview: '3 KPSEA-aligned questions testing fraction operations and decimal conversions in real-life contexts.',
    contentJson: [
      {
        number: 1,
        text: 'A farmer used 2/5 of his land to plant maize, 1/4 to plant beans, and left the rest for grazing. What fraction of the land was left for grazing?',
        topic: 'Fractions and Decimals',
        marks: 3,
        modelAnswerOutline: '• Add planted fractions: 2/5 + 1/4 = 8/20 + 5/20 = 13/20 (2 mks)\n• Subtract from whole: 1 - 13/20 = 7/20 (1 mk)',
      },
      {
        number: 2,
        text: 'Convert 3/8 into a decimal and round your answer to two decimal places.',
        topic: 'Fractions and Decimals',
        marks: 2,
        modelAnswerOutline: '• 3 ÷ 8 = 0.375 (1 mk)\n• Rounded to 2 decimal places = 0.38 (1 mk)',
      },
      {
        number: 3,
        text: 'Wanjiku bought 2.45 kg of sugar and 1.8 kg of rice. What was the total mass of the items in kilograms?',
        topic: 'Fractions and Decimals',
        marks: 2,
        modelAnswerOutline: '• Align decimal points: 2.45 + 1.80 (1 mk)\n• Total mass = 4.25 kg (1 mk)',
      },
    ],
    reuseCount: 22,
    createdAt: '2026-10-21T07:00:00.000Z',
    updatedAt: '2026-10-23T16:00:00.000Z',
  },
];

export const learnerPoolService = {
  /**
   * Searches local cache + Supabase pool for an existing relatable learning material.
   */
  async findPooledMaterial(params: {
    itemType: PoolItemType;
    grade?: string;
    subject: string;
    query: string;
  }): Promise<LearnerPoolItem | null> {
    const fingerprint = buildPoolFingerprint(params);
    const tokens = extractPoolTokens(params.query, params.subject);
    const subjectLower = String(params.subject || '').toLowerCase().trim();
    const gradeLower = String(params.grade || '').toLowerCase().trim();

    // 1. Check local pool first (instant & works offline)
    const localItems = readLocalPool();
    const exactLocal = localItems.find((item) => item.queryFingerprint === fingerprint);
    if (exactLocal) {
      return upsertLocalPoolItem(exactLocal);
    }

    const fuzzyLocal = localItems.find(
      (item) =>
        item.itemType === params.itemType &&
        item.subject.toLowerCase() === subjectLower &&
        (!gradeLower || item.grade.toLowerCase() === gradeLower) &&
        computeTokenOverlap(item.searchTokens || [], tokens) >= 0.75
    );
    if (fuzzyLocal) {
      return upsertLocalPoolItem(fuzzyLocal);
    }

    // 2. Check remote Supabase pool if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null;
    }
    if (!supabase || typeof (supabase as any).rpc !== 'function') {
      return null;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.rpc('find_pooled_learning_material', {
          p_item_type: params.itemType,
          p_grade: params.grade || '',
          p_subject: params.subject,
          p_fingerprint: fingerprint,
          p_tokens: tokens,
        })
      );
      if (error || !data || typeof data !== 'object') return null;
      const item = data as LearnerPoolItem;
      if (!item.contentJson) return null;
      upsertLocalPoolItem(item);
      return item;
    } catch {
      return null;
    }
  },

  /**
   * Stores a newly generated educational material in both local cache and the shared cloud pool.
   */
  async savePooledMaterial(params: {
    itemType: PoolItemType;
    examPathway?: string;
    grade?: string;
    subject: string;
    topic: string;
    promptText?: string;
    summaryPreview?: string;
    contentJson: any;
  }): Promise<LearnerPoolItem> {
    const queryText = params.promptText || params.topic;
    const fingerprint = buildPoolFingerprint({
      itemType: params.itemType,
      grade: params.grade,
      subject: params.subject,
      query: queryText,
    });
    const tokens = extractPoolTokens(queryText, params.subject);
    const nowIso = new Date().toISOString();

    const localItem: LearnerPoolItem = {
      id: `pool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemType: params.itemType,
      examPathway: params.examPathway || 'KJSEA',
      grade: params.grade || 'Grade 9',
      subject: params.subject,
      topic: params.topic.trim() || 'General Revision',
      queryFingerprint: fingerprint,
      searchTokens: tokens,
      promptText: (params.promptText || params.topic).trim(),
      summaryPreview: (params.summaryPreview || '').trim(),
      contentJson: params.contentJson,
      reuseCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const savedLocal = upsertLocalPoolItem(localItem);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return savedLocal;
    }
    if (!supabase || typeof (supabase as any).rpc !== 'function') {
      return savedLocal;
    }

    try {
      const { data, error } = await withTimeout(
        supabase.rpc('save_pooled_learning_material', {
          p_item_type: localItem.itemType,
          p_exam_pathway: localItem.examPathway,
          p_grade: localItem.grade,
          p_subject: localItem.subject,
          p_topic: localItem.topic,
          p_fingerprint: localItem.queryFingerprint,
          p_tokens: localItem.searchTokens,
          p_prompt_text: localItem.promptText,
          p_summary_preview: localItem.summaryPreview,
          p_content_json: localItem.contentJson,
        })
      );
      if (!error && data && typeof data === 'object') {
        return upsertLocalPoolItem(data as LearnerPoolItem);
      }
    } catch {
      // Non-blocking: local copy is already persisted
    }

    return savedLocal;
  },

  /**
   * Checks the pool for an existing practice question drill before generating a new one.
   */
  async findPooledPractice(params: {
    subject: string;
    topic: string;
    examType?: string;
    grade?: string;
    count?: number;
  }): Promise<PracticeQuestion[] | null> {
    const query = params.topic.trim() || `${params.subject} core revision`;
    const found = await this.findPooledMaterial({
      itemType: 'PRACTICE_DRILL',
      grade: params.grade || params.examType,
      subject: params.subject,
      query,
    });
    if (!found || !Array.isArray(found.contentJson)) return null;
    const minCount = params.count || 3;
    if (found.contentJson.length < minCount) return null;
    return found.contentJson.slice(0, minCount) as PracticeQuestion[];
  },

  /**
   * Saves a generated practice question drill to the Learner Pool.
   */
  async savePooledPractice(
    params: {
      subject: string;
      topic: string;
      examType?: string;
      grade?: string;
    },
    questions: PracticeQuestion[]
  ): Promise<LearnerPoolItem | null> {
    if (!Array.isArray(questions) || questions.length === 0) return null;
    const displayTopic = params.topic.trim() || questions[0]?.topic || `${params.subject} Practice`;
    const preview = questions
      .slice(0, 2)
      .map((q) => `Q${q.number}: ${q.text}`)
      .join(' · ')
      .slice(0, 240);

    return this.savePooledMaterial({
      itemType: 'PRACTICE_DRILL',
      examPathway: params.examType || 'KJSEA',
      grade: params.grade || 'Grade 9',
      subject: params.subject,
      topic: displayTopic,
      promptText: params.topic.trim() || `${params.subject} core revision`,
      summaryPreview: preview,
      contentJson: questions,
    });
  },

  /**
   * Checks the pool for a topic explanation or Exam Guru answer.
   */
  async findPooledExplanation(params: {
    subject: string;
    grade?: string;
    prompt: string;
  }): Promise<string | null> {
    const found = await this.findPooledMaterial({
      itemType: 'TOPIC_EXPLANATION',
      grade: params.grade,
      subject: params.subject,
      query: params.prompt,
    });
    if (!found || !found.contentJson) return null;
    if (typeof found.contentJson === 'string') return found.contentJson;
    if (typeof found.contentJson?.content === 'string') return found.contentJson.content;
    return null;
  },

  /**
   * Saves a topic explanation or Exam Guru answer to the Learner Pool.
   */
  async savePooledExplanation(
    params: {
      subject: string;
      grade?: string;
      examPathway?: string;
      topic?: string;
      prompt: string;
    },
    explanationText: string
  ): Promise<LearnerPoolItem | null> {
    const clean = String(explanationText || '').trim();
    if (clean.length < 40) return null;
    const topicTitle =
      params.topic?.trim() ||
      params.prompt.trim().replace(/[?!.]+$/, '').slice(0, 90) ||
      `${params.subject} Study Note`;
    const preview = clean.replace(/\s+/g, ' ').slice(0, 220);

    return this.savePooledMaterial({
      itemType: 'TOPIC_EXPLANATION',
      examPathway: params.examPathway || 'KJSEA',
      grade: params.grade || 'All Grades',
      subject: params.subject,
      topic: topicTitle,
      promptText: params.prompt,
      summaryPreview: preview,
      contentJson: { title: topicTitle, content: clean },
    });
  },

  /**
   * Checks the pool for a step-by-step question walkthrough (`QuestionExplanation`).
   */
  async findPooledQuestionWalkthrough(params: {
    subject?: string;
    topic?: string;
    questionText: string;
    language?: 'EN' | 'SW';
  }): Promise<QuestionExplanation | null> {
    const found = await this.findPooledMaterial({
      itemType: 'CAPTURED_QUESTION',
      grade: params.language || 'EN',
      subject: params.subject || params.topic || 'General',
      query: params.questionText,
    });
    if (!found || !found.contentJson || typeof found.contentJson !== 'object') return null;
    if (typeof found.contentJson.whatItTests === 'string') {
      return found.contentJson as QuestionExplanation;
    }
    return null;
  },

  /**
   * Saves a step-by-step question walkthrough to the Learner Pool.
   */
  async savePooledQuestionWalkthrough(
    params: {
      subject?: string;
      topic?: string;
      questionText: string;
      language?: 'EN' | 'SW';
    },
    explanation: QuestionExplanation
  ): Promise<LearnerPoolItem | null> {
    if (!explanation || !explanation.whatItTests) return null;
    const topicTitle = params.topic?.trim() || params.questionText.trim().slice(0, 80);
    return this.savePooledMaterial({
      itemType: 'CAPTURED_QUESTION',
      examPathway: 'KNEC',
      grade: params.language || 'EN',
      subject: params.subject || params.topic || 'General',
      topic: topicTitle,
      promptText: params.questionText,
      summaryPreview: explanation.whatItTests.slice(0, 220),
      contentJson: explanation,
    });
  },

  /**
   * Synchronously filters local + curated starter pool items (instant & zero-latency).
   */
  listLocalPool(
    params?: {
      grade?: string;
      subject?: string;
      itemType?: PoolItemType | 'ALL';
      search?: string;
      limit?: number;
    },
    extraRemoteItems: LearnerPoolItem[] = []
  ): LearnerPoolItem[] {
    const gradeFilter = params?.grade?.trim() || '';
    const subjectFilter = params?.subject?.trim() || '';
    const typeFilter = params?.itemType && params.itemType !== 'ALL' ? params.itemType : '';
    const searchFilter = params?.search?.trim().toLowerCase() || '';
    const maxItems = params?.limit && params.limit > 0 ? params.limit : undefined;

    const combinedMap = new Map<string, LearnerPoolItem>();
    for (const item of [...extraRemoteItems, ...readLocalPool(), ...CURATED_STARTER_POOL]) {
      if (!item || !item.queryFingerprint) continue;
      if (!combinedMap.has(item.queryFingerprint)) {
        combinedMap.set(item.queryFingerprint, item);
      }
    }

    const allItems = Array.from(combinedMap.values());
    const filtered = allItems.filter((item) => {
      if (typeFilter && item.itemType !== typeFilter) return false;
      if (subjectFilter && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) {
        return false;
      }
      if (
        gradeFilter &&
        item.grade !== 'All Grades' &&
        item.grade.toLowerCase() !== gradeFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchFilter) {
        const hay = `${item.topic} ${item.promptText} ${item.summaryPreview}`.toLowerCase();
        if (!hay.includes(searchFilter)) return false;
      }
      return true;
    });

    if (filtered.length === 0 && subjectFilter) {
      const fallback = allItems
        .filter((item) => {
          if (typeFilter && item.itemType !== typeFilter) return false;
          if (item.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
          if (searchFilter) {
            const hay = `${item.topic} ${item.promptText} ${item.summaryPreview}`.toLowerCase();
            if (!hay.includes(searchFilter)) return false;
          }
          return true;
        })
        .sort((a, b) => b.reuseCount - a.reuseCount);
      return maxItems ? fallback.slice(0, maxItems) : fallback;
    }

    const sorted = filtered.sort((a, b) => b.reuseCount - a.reuseCount);
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  },

  /**
   * Lists shared materials from the Learner Pool for browsing by grade, subject, and search term.
   */
  async listPool(params?: {
    grade?: string;
    subject?: string;
    itemType?: PoolItemType | 'ALL';
    search?: string;
    limit?: number;
  }): Promise<LearnerPoolItem[]> {
    const gradeFilter = params?.grade?.trim() || '';
    const subjectFilter = params?.subject?.trim() || '';
    const typeFilter = params?.itemType && params.itemType !== 'ALL' ? params.itemType : '';
    const searchFilter = params?.search?.trim().toLowerCase() || '';

    let remoteItems: LearnerPoolItem[] = [];
    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      supabase &&
      typeof (supabase as any).rpc === 'function'
    ) {
      try {
        const { data, error } = await withTimeout(
          supabase.rpc('list_learner_knowledge_pool', {
            p_grade: gradeFilter || null,
            p_subject: subjectFilter || null,
            p_item_type: typeFilter || null,
            p_search: searchFilter || null,
            p_limit: params?.limit || 24,
          })
        );
        if (!error && Array.isArray(data)) {
          remoteItems = data as LearnerPoolItem[];
        }
      } catch {
        // Fallback to local + curated items when offline or unreachable
      }
    }

    return this.listLocalPool(params, remoteItems);
  },

  /**
   * Answers a learner's deeper follow-up question in the Learner's Revision Pool.
   * Reuses pooled explanations first (zero AI cost); if new, generates an examiner
   * breakdown, saves it to the pool, and splits it into the 1/3 free teaser + covered paywall section.
   */
  async askAkiliDeeperExplanation(params: {
    grade?: string;
    subject: string;
    examPathway?: string;
    topic?: string;
    question: string;
    contextPreview?: string;
  }): Promise<{
    fullAnswer: string;
    visiblePart: string;
    coveredPart: string;
    fromPool: boolean;
  }> {
    const cleanQuestion = params.question.trim();
    const combinedPrompt = params.topic
      ? `${params.topic}: ${cleanQuestion}`
      : cleanQuestion;

    // 1. Check shared Learner Pool first so relatable follow-ups cost zero AI generations
    const existing = await this.findPooledExplanation({
      subject: params.subject,
      grade: params.grade,
      prompt: combinedPrompt,
    });
    if (existing && existing.length >= 120) {
      const split = splitAnswerForPaywallTeaser(existing);
      return { ...split, fromPool: true };
    }

    // 2. Try live Exam Guru generation if available
    let generatedText = '';
    try {
      const geminiModule: any = await import('./geminiService');
      if (typeof geminiModule.getExamGuruResponse === 'function') {
        const contextualQuery = [
          `Grade: ${params.grade || 'Candidate'}`,
          `Subject: ${params.subject}`,
          params.topic ? `Topic: ${params.topic}` : '',
          params.contextPreview ? `Material context: ${params.contextPreview}` : '',
          `Learner follow-up question: ${cleanQuestion}`,
        ]
          .filter(Boolean)
          .join('\n');
        const response = await geminiModule.getExamGuruResponse(contextualQuery, []);
        if (
          typeof response === 'string' &&
          response.trim().length >= 120 &&
          !/busy right now|check your connection/i.test(response)
        ) {
          generatedText = response.trim();
        }
      }
    } catch {
      // Fallback to structured examiner synthesis below
    }

    // 3. Structured KNEC examiner breakdown fallback (also ensures instant reliability in offline/test environments)
    if (!generatedText) {
      const topicLabel = params.topic || `${params.subject} Core Concept`;
      generatedText = [
        `Core Examiner Concept (${topicLabel}):`,
        `• When answering "${cleanQuestion}" in ${params.examPathway || 'KNEC'} ${params.subject}, examiners award the first mark [1 mk] for stating the exact syllabus definition or governing principle clearly before substituting values or examples.`,
        params.contextPreview ? `• Key Foundation: ${params.contextPreview}` : '',
        '',
        `Step-by-Step Marking Scheme Breakdown [3 mks]:`,
        `• Step 1 (Identification - 1 mk): Identify the command word and underline the given variables, conditions, or biological/scientific terms in the question.`,
        `• Step 2 (Working / Explanation - 1 mk): Show every intermediate step or cause-and-effect link explicitly — never skip straight to the final statement.`,
        `• Step 3 (Conclusion & Units - 1 mk): State the final result with accurate SI units, balanced chemical symbols, or complete syllabus terminology.`,
        '',
        `❌ Paper Trap: Many candidates lose 1–2 marks by giving vague everyday descriptions instead of the exact KNEC marking-scheme keywords for ${topicLabel}.`,
        `🎯 Guru Tip: Practise writing your answer in bulleted mark-scoring points where each point earns [1 mk].`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    await this.savePooledExplanation(
      {
        subject: params.subject,
        grade: params.grade,
        examPathway: params.examPathway,
        topic: params.topic || cleanQuestion.slice(0, 72),
        prompt: combinedPrompt,
      },
      generatedText
    );

    const split = splitAnswerForPaywallTeaser(generatedText);
    return { ...split, fromPool: false };
  },

  /**
   * Checks if the current learner browser has already marked a pooled item as helpful.
   */
  hasMarkedHelpful(itemId: string): boolean {
    try {
      const raw = localStorage.getItem(HELPFUL_VOTES_KEY);
      if (!raw) return false;
      const ids = JSON.parse(raw);
      return Array.isArray(ids) && ids.includes(itemId);
    } catch {
      return false;
    }
  },

  /**
   * Marks a pooled item as helpful, incrementing its reuseCount locally and in Supabase
   * so top-rated community notes and drills surface first.
   */
  async markItemHelpful(itemId: string): Promise<LearnerPoolItem | null> {
    if (!itemId) return null;
    try {
      const rawVotes = localStorage.getItem(HELPFUL_VOTES_KEY);
      const votes: string[] = rawVotes ? JSON.parse(rawVotes) : [];
      if (!votes.includes(itemId)) {
        votes.push(itemId);
        localStorage.setItem(HELPFUL_VOTES_KEY, JSON.stringify(votes.slice(-200)));
      }
    } catch {
      // Ignore storage quota errors
    }

    const localItems = readLocalPool();
    const allItems = [...localItems, ...CURATED_STARTER_POOL];
    const target = allItems.find((i) => i.id === itemId);
    if (!target) return null;

    const updated: LearnerPoolItem = {
      ...target,
      reuseCount: (target.reuseCount || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    const nextLocal = [
      updated,
      ...localItems.filter((i) => i.queryFingerprint !== target.queryFingerprint),
    ];
    writeLocalPool(nextLocal);

    if (
      typeof navigator !== 'undefined' &&
      navigator.onLine &&
      supabase &&
      typeof (supabase as any).rpc === 'function'
    ) {
      try {
        await withTimeout(
          supabase.rpc('save_pooled_learning_material', {
            p_item_type: updated.itemType,
            p_exam_pathway: updated.examPathway,
            p_grade: updated.grade,
            p_subject: updated.subject,
            p_topic: updated.topic,
            p_fingerprint: updated.queryFingerprint,
            p_tokens: updated.searchTokens,
            p_prompt_text: updated.promptText,
            p_summary_preview: updated.summaryPreview,
            p_content_json: updated.contentJson,
          })
        );
      } catch {
        // Non-blocking
      }
    }

    return updated;
  },

  /**
   * Finds a pooled captured revision paper or scanned note analysis (`REVISION_PAPER`).
   */
  async findPooledCapturedPaper(params: {
    subject: string;
    grade?: string;
    query: string;
  }): Promise<ExamAnalysis | null> {
    const found = await this.findPooledMaterial({
      itemType: 'REVISION_PAPER',
      grade: params.grade,
      subject: params.subject,
      query: params.query,
    });
    if (!found || !found.contentJson || !Array.isArray(found.contentJson.questions)) {
      return null;
    }
    return found.contentJson as ExamAnalysis;
  },

  /**
   * Saves a scanned photo, captured class note, or analysed revision paper (`ExamAnalysis`)
   * into the shared Learner Knowledge Pool (`REVISION_PAPER`), and also extracts a 3-question
   * `PRACTICE_DRILL` so other candidates immediately see it in the free Learner's Revision Pool.
   */
  async savePooledCapturedPaper(
    analysis: ExamAnalysis,
    sourceHint?: string
  ): Promise<LearnerPoolItem | null> {
    if (!analysis || !Array.isArray(analysis.questions) || analysis.questions.length === 0) {
      return null;
    }
    const subject = analysis.subject || 'General';
    const grade = analysis.grade || 'Form 4';
    const firstTopics = Array.from(
      new Set(analysis.questions.map((q) => q.topic).filter(Boolean))
    ).slice(0, 3);
    const topicTitle =
      sourceHint?.trim() ||
      (firstTopics.length > 0
        ? `${subject}: ${firstTopics.join(', ')}`
        : `${subject} Captured Revision Questions`);
    const preview = analysis.questions
      .slice(0, 2)
      .map((q) => `Q${q.number}: ${q.text}`)
      .join(' · ')
      .slice(0, 240);

    // Also populate a 3-question Practice Drill into the pool so learners on /revision can practise it directly
    const drillQuestions: PracticeQuestion[] = analysis.questions.slice(0, 3).map((q, idx) => ({
      number: idx + 1,
      text: q.text,
      marks: q.marks || 2,
      topic: q.topic || topicTitle,
      guidance: q.competency ? `Competency: ${q.competency}` : undefined,
      modelAnswerOutline:
        Array.isArray(q.markingScheme) && q.markingScheme.length > 0
          ? q.markingScheme.join('; ')
          : q.modelAnswer || 'State the core syllabus concept and show working clearly.',
    }));
    if (drillQuestions.length >= 1) {
      await this.savePooledPractice(
        {
          subject,
          topic: topicTitle,
          examType: analysis.examType || 'KNEC',
          grade,
        },
        drillQuestions
      );
    }

    return this.savePooledMaterial({
      itemType: 'REVISION_PAPER',
      examPathway: analysis.examType || 'KNEC',
      grade,
      subject,
      topic: topicTitle,
      promptText: `${topicTitle} ${analysis.questions[0]?.text || ''}`.trim(),
      summaryPreview: preview,
      contentJson: analysis,
    });
  },

  /**
   * Records that a specific learner (`owner`) has completed a pooled drill so rotational
   * practice prioritizes unseen drills first.
   */
  markDrillCompletedByLearner(owner: string, drillIdOrFingerprint: string) {
    if (!owner || !drillIdOrFingerprint) return;
    try {
      const key = `${COMPLETED_DRILLS_PREFIX}${owner}`;
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(drillIdOrFingerprint)) {
        list.push(drillIdOrFingerprint);
        localStorage.setItem(key, JSON.stringify(list.slice(-150)));
      }
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Returns the next unseen pooled practice drill for a learner (`owner`) in the selected
   * grade and subject, rotating back to the highest-rated drill once all have been seen.
   */
  getNextRotationalPoolDrill(
    owner: string,
    params: { grade?: string; subject: string; topic?: string }
  ): LearnerPoolItem | null {
    const drills = this.listLocalPool({
      grade: params.grade,
      subject: params.subject,
      itemType: 'PRACTICE_DRILL',
      search: params.topic,
    }).filter((item) => Array.isArray(item.contentJson) && item.contentJson.length > 0);

    if (drills.length === 0) return null;

    let seen: string[] = [];
    try {
      const raw = localStorage.getItem(`${COMPLETED_DRILLS_PREFIX}${owner || 'guest'}`);
      seen = raw ? JSON.parse(raw) : [];
    } catch {
      seen = [];
    }

    const unseen = drills.find(
      (d) => !seen.includes(d.id) && !seen.includes(d.queryFingerprint)
    );
    const chosen = unseen || drills[0];
    this.markDrillCompletedByLearner(owner || 'guest', chosen.id);
    return chosen;
  },

  /**
   * Computes real-time Learner Pool & AI Cost-Savings analytics for the Admin Command Center.
   */
  async getPoolAnalytics(): Promise<LearnerPoolAnalytics> {
    const allItems = await this.listPool({ limit: 60 });
    let removedIds: string[] = [];
    try {
      const raw = localStorage.getItem(REMOVED_POOL_IDS_KEY);
      removedIds = raw ? JSON.parse(raw) : [];
    } catch {
      removedIds = [];
    }
    const activeItems = allItems.filter((item) => !removedIds.includes(item.id));
    const totalItems = activeItems.length;
    const totalDrills = activeItems.filter((i) => i.itemType === 'PRACTICE_DRILL').length;
    const totalNotes = activeItems.filter(
      (i) => i.itemType === 'TOPIC_EXPLANATION' || i.itemType === 'CAPTURED_QUESTION'
    ).length;
    const totalCapturedPapers = activeItems.filter((i) => i.itemType === 'REVISION_PAPER').length;
    const totalReuses = activeItems.reduce((sum, i) => sum + Math.max(1, i.reuseCount || 1), 0);
    const generationsSaved = Math.max(0, totalReuses - totalItems);
    const estimatedSavingsKes = Math.round(generationsSaved * AVG_AI_GENERATION_COST_KES * 100) / 100;

    return {
      totalItems,
      totalDrills,
      totalNotes,
      totalCapturedPapers,
      totalReuses,
      generationsSaved,
      estimatedSavingsKes,
      topItems: activeItems.slice(0, 12),
    };
  },

  /**
   * Pins/boosts a pooled material (`+10` reuse score) so it ranks at the top for learners.
   */
  async boostPooledItem(itemId: string, bonus = 10): Promise<LearnerPoolItem | null> {
    const localItems = readLocalPool();
    const allItems = [...localItems, ...CURATED_STARTER_POOL];
    const target = allItems.find((i) => i.id === itemId);
    if (!target) return null;
    const boosted: LearnerPoolItem = {
      ...target,
      reuseCount: (target.reuseCount || 1) + Math.max(1, bonus),
      updatedAt: new Date().toISOString(),
    };
    writeLocalPool([
      boosted,
      ...localItems.filter((i) => i.queryFingerprint !== target.queryFingerprint),
    ]);
    return boosted;
  },

  /**
   * Removes an item from the Learner Knowledge Pool (Admin moderation).
   */
  async deletePooledItem(itemId: string): Promise<boolean> {
    if (!itemId) return false;
    try {
      const raw = localStorage.getItem(REMOVED_POOL_IDS_KEY);
      const removed: string[] = raw ? JSON.parse(raw) : [];
      if (!removed.includes(itemId)) {
        removed.push(itemId);
        localStorage.setItem(REMOVED_POOL_IDS_KEY, JSON.stringify(removed));
      }
      const nextLocal = readLocalPool().filter((i) => i.id !== itemId);
      writeLocalPool(nextLocal);
      if (supabase && typeof (supabase as any).from === 'function') {
        await supabase.from('learner_knowledge_pool').delete().eq('id', itemId);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Formats a clean, printable 1-Page Revision Sheet HTML document for any pooled note or drill.
   */
  formatPrintableRevisionSheetHtml(item: LearnerPoolItem): string {
    const escapeHtml = (value: string) =>
      String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    let bodyHtml = '';
    if (item.itemType === 'PRACTICE_DRILL' && Array.isArray(item.contentJson)) {
      bodyHtml = `<ol>${item.contentJson
        .map(
          (q: any) =>
            `<li style="margin-bottom:14px;"><strong>${escapeHtml(q.text || '')}</strong> <em>(${Number(q.marks) || 2} marks)</em><br/><span style="color:#065f46;font-size:13px;">Marking guide: ${escapeHtml(q.modelAnswerOutline || (Array.isArray(q.markingScheme) ? q.markingScheme.join('; ') : ''))}</span></li>`
        )
        .join('')}</ol>`;
    } else if (typeof item.contentJson === 'string') {
      bodyHtml = `<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.65;">${escapeHtml(item.contentJson)}</pre>`;
    } else if (typeof item.contentJson?.content === 'string') {
      bodyHtml = `<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.65;">${escapeHtml(item.contentJson.content)}</pre>`;
    } else {
      bodyHtml = `<p style="line-height:1.65;">${escapeHtml(item.summaryPreview)}</p>`;
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(item.topic)} · Soma AI Revision Sheet</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 28px; max-width: 780px; }
    .header { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 8px 0 4px; }
    .meta { color: #475569; font-size: 13px; font-weight: 600; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #475569; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Soma AI · Learner’s Revision Pool (100% Free)</span>
      <h1>${escapeHtml(item.topic)}</h1>
      <div class="meta">${escapeHtml(item.grade)} · ${escapeHtml(item.subject)} · Studied by ${item.reuseCount} learners</div>
    </div>
  </div>
  <div class="content">${bodyHtml}</div>
  <div class="footer">
    <span>Generated &amp; shared via Soma AI Learner’s Revision Pool</span>
    <strong>https://www.somaai.co.ke/revision</strong>
  </div>
</body>
</html>`;
  },

  /**
   * Opens a print-ready window for a pooled study note or practice drill.
   */
  printPooledRevisionSheet(item: LearnerPoolItem): boolean {
    if (typeof window === 'undefined') return false;
    const html = this.formatPrintableRevisionSheetHtml(item);
    const win = window.open('', '_blank', 'noopener,noreferrer,width=840,height=720');
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try {
        win.print();
      } catch {
        // ignore if print dialog blocked
      }
    }, 150);
    return true;
  },
};

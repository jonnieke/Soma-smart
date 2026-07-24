import { AIModelRegistryEntry, PromptRegistryEntry, ModelEvaluationRun } from '../types/platformCore';

const MODEL_REGISTRY_KEY = 'soma_ai_model_registry';
const PROMPT_REGISTRY_KEY = 'soma_ai_prompt_registry';
const EVAL_RUNS_KEY = 'soma_ai_eval_runs';

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

export const aiGovernanceService = {
  /** Get AI Model Registry entries */
  getModels(): AIModelRegistryEntry[] {
    const list = readLocal<AIModelRegistryEntry[]>(MODEL_REGISTRY_KEY, []);
    if (list.length > 0) return list;

    const seed: AIModelRegistryEntry[] = [
      {
        id: 'mod_gemini_pro_15',
        provider: 'Google Gemini',
        modelName: 'gemini-1.5-pro',
        modelVersion: '2026-06',
        capabilities: ['paper_generation', 'blueprint_extraction', 'essay_marking'],
        approvedUseCases: ['paper_studio', 'blueprint_upload', 'subjective_marking'],
        prohibitedUseCases: ['unsupervised_high_stakes_grading'],
        riskLevel: 'moderate',
        inputDataClasses: ['public', 'internal', 'confidential'],
        supportsStructuredOutput: true,
        supportsBatch: true,
        evaluationStatus: 'approved',
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mod_gemini_flash_15',
        provider: 'Google Gemini',
        modelName: 'gemini-1.5-flash',
        modelVersion: '2026-06',
        capabilities: ['fast_classification', 'chat_tutoring', 'keyword_tagging'],
        approvedUseCases: ['ask_akili_chat', 'curriculum_mapping'],
        prohibitedUseCases: ['official_exam_generation'],
        riskLevel: 'low',
        inputDataClasses: ['public', 'internal'],
        supportsStructuredOutput: true,
        supportsBatch: true,
        evaluationStatus: 'approved',
        rolloutPercentage: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(MODEL_REGISTRY_KEY, seed);
    return seed;
  },

  /** Get Prompt Registry entries */
  getPrompts(): PromptRegistryEntry[] {
    const list = readLocal<PromptRegistryEntry[]>(PROMPT_REGISTRY_KEY, []);
    if (list.length > 0) return list;

    const seed: PromptRegistryEntry[] = [
      {
        id: 'prm_paper_gen_v2',
        useCaseId: 'paper_studio',
        name: 'CBC/KCSE Paper Generator Prompt',
        version: 'v2.4.0',
        systemPrompt: 'You are an expert KICD CBC & KCSE examination item author. Generate balanced questions with clear rubrics.',
        status: 'approved',
        evaluationRunIds: ['eval_run_001'],
        createdBy: 'usr_curriculum_lead',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(PROMPT_REGISTRY_KEY, seed);
    return seed;
  },

  /** Get Evaluation Runs */
  getEvaluationRuns(): ModelEvaluationRun[] {
    const list = readLocal<ModelEvaluationRun[]>(EVAL_RUNS_KEY, []);
    if (list.length > 0) return list;

    const seed: ModelEvaluationRun[] = [
      {
        id: 'eval_run_001',
        modelRegistryId: 'mod_gemini_pro_15',
        promptVersionId: 'prm_paper_gen_v2',
        evaluationSuiteId: 'suite_kicd_alignment_2026',
        environment: 'staging',
        datasetVersion: 'v2026.3',
        totalCases: 150,
        passedCases: 147,
        failedCases: 3,
        scoreSummary: { curriculumAlignment: 98.2, answerCorrectness: 99.1, safetyCompliance: 100 },
        estimatedCost: 12.50,
        startedAt: '2026-07-22T10:00:00Z',
        completedAt: '2026-07-22T10:15:00Z',
        status: 'completed',
      },
    ];

    writeLocal(EVAL_RUNS_KEY, seed);
    return seed;
  },

  /** Enforce human review requirement for high-stakes actions */
  requiresHumanReview(useCase: string, riskLevel: 'low' | 'moderate' | 'high'): boolean {
    if (useCase === 'official_exam_publication' || useCase === 'marketplace_resource_publishing') return true;
    return riskLevel === 'high';
  },
};

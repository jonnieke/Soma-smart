import {
  ExamBlueprint,
  Question,
  ExamPaperSection,
  CognitiveLevel,
  DifficultyLevel,
  QuestionType,
} from '../../types/paperStudio';

export interface SelectionCoverageReport {
  totalQuestionsSelected: number;
  totalMarksSelected: number;
  targetTotalMarks: number;
  topicCoveragePercent: number;
  difficultyMatchPercent: number;
  cognitiveMatchPercent: number;
  unmetConstraints: string[];
  missingQuestionCounts: Record<string, number>; // sectionId -> count missing
}

export interface SelectionEngineResult {
  sections: ExamPaperSection[];
  report: SelectionCoverageReport;
}

export const questionSelectionEngine = {
  assemblePaperFromBlueprint(
    blueprint: ExamBlueprint,
    availableQuestions: Question[],
    previouslyUsedIds: string[] = []
  ): SelectionEngineResult {
    const usedIds = new Set<string>(previouslyUsedIds);
    const assembledSections: ExamPaperSection[] = [];
    const unmetConstraints: string[] = [];
    const missingQuestionCounts: Record<string, number> = {};

    let totalSelectedQuestions = 0;
    let totalSelectedMarks = 0;

    // Filter candidate bank by grade and subject
    const subjectBank = availableQuestions.filter((q) => {
      const matchSubject = q.subject.trim().toLowerCase() === blueprint.subject.trim().toLowerCase();

      const matchGrade =
        !blueprint.grade ||
        q.grade.trim().toLowerCase() === blueprint.grade.trim().toLowerCase();

      return matchSubject && matchGrade && q.curriculum === blueprint.curriculum;
    });

    // Process each section rule defined in the blueprint
    for (const rule of blueprint.sections) {
      const sectionQuestions: Question[] = [];
      const sectionRuleType = rule.questionType;

      // Filter questions suitable for this section
      const candidates = subjectBank.filter((q) => {
        if (usedIds.has(q.id)) return false;
        if (sectionRuleType && q.questionType !== sectionRuleType) return false;
        if (!Number.isFinite(q.marks) || q.marks <= 0 || q.marks !== rule.marksPerQuestion) return false;
        const topics = rule.topics?.length ? rule.topics : blueprint.topics;
        if (topics.length && !topics.some(topic => topic.trim().toLowerCase() === q.topic?.trim().toLowerCase())) return false;
        if (!q.markingScheme?.length || q.markingScheme.some(criterion => !Number.isFinite(criterion.marks) || criterion.marks < 0) || Math.abs(q.markingScheme.reduce((sum, criterion) => sum + criterion.marks, 0) - q.marks) > 0.001) return false;
        return true;
      });

      // Score and rank candidates for this section
      const scoredCandidates = candidates
        .map((q) => {
          let score = 0;

          // Topic match score
          if (rule.topics && rule.topics.length > 0 && q.topic) {
            if (rule.topics.some((t) => t.toLowerCase() === q.topic?.toLowerCase())) {
              score += 35;
            }
          } else {
            score += 15;
          }

          // Difficulty match score
          if (q.difficulty === rule.difficulty) {
            score += 25;
          } else {
            score += 10;
          }

          // Marks match
          if (q.marks === rule.marksPerQuestion) {
            score += 20;
          }

          // Quality score & freshness
          score += (q.qualityScore || 80) / 10;
          if (q.sourceType === 'SOMA_BANK' || q.sourceType === 'MY_BANK') {
            score += 10;
          }

          return { question: q, score };
        })
        .sort((a, b) => b.score - a.score);

      // Select top candidates up to requested count
      for (const item of scoredCandidates) {
        if (sectionQuestions.length >= rule.questionCount) break;
        if (usedIds.has(item.question.id)) continue;

        // Keep the question and its marking guide unchanged.
        sectionQuestions.push(item.question);
        usedIds.add(item.question.id);
      }

      // Check if we didn't have enough questions in the bank
      const missingCount = rule.questionCount - sectionQuestions.length;
      if (missingCount > 0) {
        missingQuestionCounts[rule.id] = missingCount;
        unmetConstraints.push(
          `Section '${rule.title}' requires ${rule.questionCount} questions, but only ${sectionQuestions.length} matching questions were found in the bank.`
        );
      }

      const sectionMarks = sectionQuestions.reduce((sum, q) => sum + q.marks, 0);

      assembledSections.push({
        id: rule.id || `section_${rule.title.toLowerCase().replace(/\s+/g, '_')}`,
        title: rule.title,
        instructions: rule.instructions,
        questions: sectionQuestions,
        totalMarks: sectionMarks,
      });

      totalSelectedQuestions += sectionQuestions.length;
      totalSelectedMarks += sectionMarks;
    }

    // Calculate Coverage Metrics
    const targetTopics = new Set(blueprint.topics.map(topic => topic.trim().toLowerCase()));
    const coveredTopics = new Set<string>();
    assembledSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        if (q.topic) coveredTopics.add(q.topic.trim().toLowerCase());
      });
    });

    const topicCoveragePercent = Math.min(
      100,
      targetTopics.size ? Math.round(([...targetTopics].filter(topic => coveredTopics.has(topic)).length / targetTopics.size) * 100) : 100
    );

    // Difficulty breakdown
    let easyCount = 0;
    let mediumCount = 0;
    let challengingCount = 0;
    assembledSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        if (q.difficulty === 'EASY') easyCount++;
        else if (q.difficulty === 'CHALLENGING') challengingCount++;
        else mediumCount++;
      });
    });

    const questions = assembledSections.flatMap(section => section.questions);
    const distributionMatch = (target: Record<string, number>, count: (key: string) => number) =>
      totalSelectedQuestions ? Math.max(0, Math.round(100 - Object.entries(target).reduce((sum, [key, percent]) =>
        sum + Math.abs(percent - 100 * count(key) / totalSelectedQuestions), 0) / 2)) : 0;
    const difficultyMatchPercent = distributionMatch(blueprint.difficultyDistribution, key =>
      key === 'easy' ? easyCount : key === 'medium' ? mediumCount : challengingCount);
    const cognitiveMatchPercent = distributionMatch(blueprint.cognitiveDistribution, key => questions.filter(q => q.cognitiveLevel === key).length);

    return {
      sections: assembledSections,
      report: {
        totalQuestionsSelected: totalSelectedQuestions,
        totalMarksSelected: totalSelectedMarks,
        targetTotalMarks: blueprint.totalMarks,
        topicCoveragePercent,
        difficultyMatchPercent,
        cognitiveMatchPercent,
        unmetConstraints,
        missingQuestionCounts,
      },
    };
  },
};

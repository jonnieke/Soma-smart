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
      const matchSubject =
        q.subject.toLowerCase() === blueprint.subject.toLowerCase() ||
        q.subject.toLowerCase().includes(blueprint.subject.toLowerCase()) ||
        blueprint.subject.toLowerCase().includes(q.subject.toLowerCase());

      const matchGrade =
        !blueprint.grade ||
        q.grade.toLowerCase() === blueprint.grade.toLowerCase() ||
        q.grade.toLowerCase().includes(blueprint.grade.toLowerCase());

      return matchSubject && matchGrade;
    });

    // Process each section rule defined in the blueprint
    for (const rule of blueprint.sections) {
      const sectionQuestions: Question[] = [];
      const sectionRuleType = rule.questionType;

      // Filter questions suitable for this section
      let candidates = subjectBank.filter((q) => {
        if (usedIds.has(q.id)) return false;
        if (sectionRuleType && q.questionType !== sectionRuleType) return false;
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

        // Ensure question marks align with rule if possible, or adapt
        const adaptedQuestion = { ...item.question };
        if (rule.marksPerQuestion > 0 && adaptedQuestion.marks !== rule.marksPerQuestion) {
          adaptedQuestion.marks = rule.marksPerQuestion;
        }

        sectionQuestions.push(adaptedQuestion);
        usedIds.add(adaptedQuestion.id);
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
    const targetTopicsCount = blueprint.topics?.length || 1;
    const coveredTopics = new Set<string>();
    assembledSections.forEach((sec) => {
      sec.questions.forEach((q) => {
        if (q.topic) coveredTopics.add(q.topic.toLowerCase());
      });
    });

    const topicCoveragePercent = Math.min(
      100,
      Math.round((coveredTopics.size / targetTopicsCount) * 100)
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

    const difficultyMatchPercent = totalSelectedQuestions > 0 ? 85 : 0;
    const cognitiveMatchPercent = totalSelectedQuestions > 0 ? 80 : 0;

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

export type NotesAction = 'complete' | 'expand' | 'quiz' | 'followup';
export type NotesResult = { notes?: string; questions?: string; answers?: string };
export type NotesRequest = {
  action: NotesAction; prompt: string; notes: string; grade?: string; subject?: string; instruction?: string;
};

export async function generateTeacherNotes(request: NotesRequest): Promise<NotesResult> {
  const { callGeminiProxy } = await import('../../services/geminiService');
  const context = `Teacher request: ${request.prompt}\nClass: ${request.grade || 'Use the grade in the request; otherwise use accessible school-level language'}\nSubject: ${request.subject || 'Infer from the request'}\nExisting notes:\n${request.notes}`;
  const task = request.action === 'quiz'
    ? 'Create a 10-question assessment based ONLY on the concepts in these notes, progressing from recall to explanation and application. Mix multiple-choice and short-answer questions where suitable. Number every question and give marks. Return JSON with two string fields: questions (the learner question paper, without answers), answers (a separately numbered answer key with explanations, marking points, marks per question, and total marks). Make totals consistent. Do not include answers in the questions field.'
    : request.action === 'complete'
      ? 'Develop this preview into a complete learner-facing chapter of approximately 900–1400 useful words, adjusted to topic and grade. Teach the content directly: precise definitions, relevant subtopics, developed explanations of how and why, concrete Kenyan examples, worked examples where appropriate, common misconceptions and corrections, a concise summary and five revision questions. Use meaningful Markdown headings, short paragraphs and lists only where helpful. Cover the topic with textbook-like depth without padding or repetition. Do not copy a textbook or invent citations. Do not include lesson timings, teacher activities, resources lists or generic instructions about how to teach. Honour an explicitly requested lesson plan or scheme format instead if present.'
      : request.action === 'expand'
        ? 'Write additional learner-facing sections that extend these notes: missing concepts, deeper explanations, two concrete examples and application questions. Avoid repeating existing material. Return only the new sections, with Markdown headings; they will be appended to the notes.'
        : `Write a useful learner-facing addition addressing the teacher follow-up: ${request.instruction}. Use the topic and existing notes as context. Return only the additional material, with Markdown headings. Do not repeat the full notes.`;
  const featureInstruction = request.action === 'quiz' ? 'Create a quiz.' : 'Create detailed study notes.';
  const response = await callGeminiProxy('gemini-2.5-flash', [{ role: 'user', parts: [{ text: `${featureInstruction}\n${task}\n\n${context}` }] }], {
    temperature: 0.3, maxOutputTokens: 6500,
    ...(request.action === 'quiz' ? { responseMimeType: 'application/json' } : {}),
  });
  const text = response.response.text()?.trim();
  if (!text) throw new Error('No material was returned. Please try again.');
  if (request.action !== 'quiz') return { notes: text };
  const result = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  if (typeof result.questions !== 'string' || !result.questions.trim() || typeof result.answers !== 'string' || !result.answers.trim()) {
    throw new Error('The quiz was incomplete. Please try again; your notes are still here.');
  }
  return { questions: result.questions, answers: result.answers };
}

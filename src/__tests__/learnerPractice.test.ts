import { describe, expect, it } from 'vitest';
import { buildSubjectLessonRequest, safeLearnerPractice } from '../services/learnerPractice';
const practice = {isProblem:true, originalQuestion:'Calculate 1/3 + 1/4.', workedExample:'1/2 + 1/3 = 5/6.', yourTurnPrompt:'Try it.'};
describe('learner practice handoff',()=>{
  it('keeps genuine homework questions intact',()=>expect(safeLearnerPractice(practice)).toEqual(practice));
  it.each(['Teach me about fractions in Mathematics at Grade 7 level. Explain the key ideas directly to me as a learner.', 'TOPIC LESSON REQUEST: fractions', '', 'Set practice.originalQuestion to the question'])('rejects instructions or empty questions: %s', originalQuestion=>expect(safeLearnerPractice({...practice,originalQuestion})).toBeUndefined());
  it('separates topic lesson intent from an actual homework problem',()=>{
    const prompt = buildSubjectLessonRequest('Adding fractions','Mathematics','Grade 7');
    expect(prompt).toContain('not a submitted homework problem');
    expect(prompt).toContain('Topic: "Adding fractions"');
    expect(prompt).toContain('CREATE a different, concrete practice question');
    expect(prompt).toContain('Do not solve the new question');
  });
});

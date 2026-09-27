import {describe, expect, it} from 'vitest';
import {buildLessonNotebookEntry} from '../services/lessonNotebook';
import type {ExplanationResult} from '../types';
const answer: ExplanationResult = {topic:'Adding fractions',explanation:'Use a common denominator.',level:'Simple',summaryPoints:['Find the LCM.'],subtopics:[{title:'Equivalent fractions',blocks:[{type:'paragraph',text:'Multiply top and bottom equally.'},{type:'list',items:['1/2 = 2/4']}]}],recapNodes:[{point:'Remember',details:'Simplify the result.'}],relatedTopics:['Subtracting fractions'],practice:{isProblem:true,originalQuestion:'Find 1/2 + 1/5.',workedExample:'1/3 + 1/4 = 7/12.',yourTurnPrompt:'Show your working.'}};
describe('lesson notebook snapshot',()=>{
 it('preserves the selected lesson context over profile and previous document',()=>{
   expect(buildLessonNotebookEntry(answer,{subject:'Mathematics',grade:'Grade 7',profileGrade:'Grade 3',documentGrade:'Form 1',documentSubject:'Biology'})).toMatchObject({subject:'Mathematics',grade:'Grade 7'});
 });
 it('includes all lesson content, worked example and unanswered practice',()=>{
   const note = buildLessonNotebookEntry(answer,{});
   for(const text of ['Use a common denominator.','Find the LCM.','Multiply top and bottom equally.','1/2 = 2/4','Simplify the result.','1/3 + 1/4 = 7/12.','Find 1/2 + 1/5.','Show your working.','Subtracting fractions']) expect(note.content).toContain(text);
 });
 it('falls back to document context then profile when lesson context is unavailable',()=>{
   expect(buildLessonNotebookEntry(answer,{documentSubject:'Maths',documentGrade:'Grade 6',profileGrade:'Grade 3'})).toMatchObject({subject:'Maths',grade:'Grade 6'});
   expect(buildLessonNotebookEntry(answer,{profileGrade:'Grade 3'})).toMatchObject({subject:'General',grade:'Grade 3'});
 });
 it('does not persist internal teaching requests as learner questions',()=>{
   expect(buildLessonNotebookEntry({...answer,practice:{...answer.practice!,originalQuestion:'Teach me about fractions'}},{}).content).not.toContain('Teach me about');
 });
});

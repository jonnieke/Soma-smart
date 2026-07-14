-- Preserve learner-visible response controls while keeping all marking fields private.
create or replace function public._public_exam_questions(raw_questions jsonb)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', elem.q->'id',
          'number', elem.q->'number',
          'orderIndex', elem.q->'orderIndex',
          'text', elem.q->'text',
          'topic', elem.q->'topic',
          'section', elem.q->'section',
          'subStrand', elem.q->'subStrand',
          'competency', elem.q->'competency',
          'cognitiveLevel', elem.q->'cognitiveLevel',
          'marks', elem.q->'marks',
          'diagramUrl', elem.q->'diagramUrl',
          'questionType', elem.q->'questionType',
          'options', elem.q->'options',
          'answerFormat', elem.q->'answerFormat'
        )
      )
      order by elem.ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(raw_questions, '[]'::jsonb)) with ordinality as elem(q, ordinality);
$$;

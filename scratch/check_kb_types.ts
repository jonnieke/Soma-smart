import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpbcxruekqigvcksbkgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmN4cnVla3FpZ3Zja3Nia2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTAyOTcsImV4cCI6MjA4NDQyNjI5N30.aSWKl3R6tQgVQPIZol8Hgbws3nN_qCCs5ujWmc7HkPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
  const { data, error } = await supabase.from('knowledge_base').select('type, grade').limit(200);
  if (error) {
    console.error(error);
    return;
  }
  const types = [...new Set(data?.map(d => d.type))];
  const grades = [...new Set(data?.map(d => d.grade))];
  console.log('Unique Types:', types);
  console.log('Unique Grades:', grades);
  
  const notes = data?.filter(d => d.type === 'NOTES');
  console.log('Number of NOTES:', notes?.length);
  if (notes && notes.length > 0) {
    console.log('Example NOTE grade:', notes[0].grade);
  }

  const pastPapers = data?.filter(d => d.type === 'PAST_PAPER');
  console.log('Number of PAST_PAPER:', pastPapers?.length);
}

checkTypes();

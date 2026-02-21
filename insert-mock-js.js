import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY='));
const serviceKey = envLine.split('=')[1].trim();
const urlLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_URL='));
const url = urlLine.split('=')[1].trim();

const supabase = createClient(url, serviceKey);

async function run() {
  const kbData = [
    { title: 'KCSE Mathematics Past Paper 2023', description: 'Official KCSE Past Paper for Mathematics', subject: 'Mathematics', grade: 'Form 4', type: 'PAST_PAPER', file_url: 'https://example.com/math.pdf' },
    { title: 'Photosynthesis Notes', description: 'Comprehensive notes on photosynthesis for CBC', subject: 'Science', grade: 'Grade 7', type: 'NOTES', file_url: 'https://example.com/science.pdf' }
  ];
  
  const mkData = [
    { teacher_id: 'teacher-1', teacher_name: 'Mr. Omondi', title: 'Form 2 Chemistry Revision Guidelines', description: 'Complete revision package', price: 150, grade: 'Form 2', subject: 'Chemistry', category: 'NOTES', file_url: 'https://example.com/chem.pdf', preview_url: 'https://example.com/preview.pdf', download_count: 45, rating: 4.8 },
    { teacher_id: 'teacher-2', teacher_name: 'Mwalimu Jane', title: 'CBC Grade 6 Creative Arts', description: 'Creative arts guide for Grade 6 learners', price: 50, grade: 'Grade 6', subject: 'Creative Arts', category: 'NOTES', file_url: 'https://example.com/arts.pdf', preview_url: 'https://example.com/arts_preview.pdf', download_count: 120, rating: 5.0 }
  ];

  await supabase.from('knowledge_base').insert(kbData);
  await supabase.from('marketplace_materials').insert(mkData);
  console.log('Inserted mock data');
}
run();

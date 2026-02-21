import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const anonKeyLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='));
const anonKey = anonKeyLine ? anonKeyLine.split('=')[1].trim() : null;

const urlLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_URL='));
const url = urlLine.split('=')[1].trim();

const supabase = createClient(url, anonKey);

async function testRemoteAuth() {
  console.log('Signing up dummy user...');

  const email = 'test_check_' + Date.now() + '@soma.com';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  
  if (authError || !authData.session) {
    console.error('Failed to created authenticated session:', authError);
    return;
  }
  
  const token = authData.session.access_token;
  console.log('Successfully created authenticated session!');
  
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, title, grade, subject');
    
  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Knowledge Base Data with Auth:', JSON.stringify(data, null, 2));
    console.log('Found ' + (data ? data.length : 0) + ' records!');
  }
  
  const { data: mkData, error: mkError } = await supabase
    .from('marketplace_materials')
    .select('id, title, grade');
    
  if (mkError) {
    console.error('Error fetching marketplace:', mkError);
  } else {
    console.log('Marketplace Data with Auth:', JSON.stringify(mkData, null, 2));
    console.log('Found ' + (mkData ? mkData.length : 0) + ' records!');
  }
}

testRemoteAuth();

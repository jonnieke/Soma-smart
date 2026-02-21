import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const anonKeyLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='));
const anonKey = anonKeyLine ? anonKeyLine.split('=')[1].trim() : null;

const urlLine = readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('VITE_SUPABASE_URL='));
const url = urlLine.split('=')[1].trim();

fetch(url + '/rest/v1/knowledge_base?select=id,title,type,grade&limit=5', {
    headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
})
.then(res => res.json())
.then(data => console.log('Data with Anon Key:', data))
.catch(err => console.error('Error:', err));

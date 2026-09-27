// Prints idempotent seed SQL for review. Never overwrites an editor's published changes.
import { readFile } from 'node:fs/promises';
const videos = JSON.parse(await readFile(new URL('../src/data/learningVideoSeed.json', import.meta.url), 'utf8'));
const columns = Object.keys(videos[0]);
const literal = value => typeof value === 'boolean' ? String(value) : `'${(typeof value === 'string' ? value : JSON.stringify(value)).replaceAll("'", "''")}'`;
console.log(`insert into public.learning_videos (${columns.join(',')}) values\n${videos.map(v => `(${columns.map(c => literal(v[c])).join(',')})`).join(',\n')}\non conflict (id) do nothing;`);

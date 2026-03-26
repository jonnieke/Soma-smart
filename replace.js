const fs = require('fs');
function processFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  // 1. Add import
  if (!content.includes('MaybeMotion')) {
    content = content.replace(/import \{ motion/g, "import { MaybeMotion } from '../components/MaybeMotion';\nimport { motion);
  }
  // 2. Add lowDataMode to useApp
  if (!content.includes('lowDataMode')) {
    content = content.replace(/useApp\(\);/, 'useApp(); const lowDataMode = false; /* TEMPORARY FALLBACK */');
    content = content.replace(/const \{([^}]+)\} = useApp\(\);/, (match, group) => {
      return const {, lowDataMode} = useApp();;
    });
  }
  // 3. Replace
  content = content.replace(/<motion\.([a-zA-Z0-9]+)/g, '<MaybeMotion as="" lowDataMode={lowDataMode}');
  content = content.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</MaybeMotion>');
  fs.writeFileSync(path, content, 'utf8');
  console.log('Processed', path);
}
processFile('d:/software/soma 17.1/somaai/Soma-smart/src/features/learner/Learner.tsx');
processFile('d:/software/soma 17.1/somaai/Soma-smart/src/features/teacher/Teacher.tsx');


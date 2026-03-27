const fs = require('fs');
const path = 'd:/software/soma 17.1/somaai/Soma-smart/src/pages/LandingPage.tsx';
let txt = fs.readFileSync(path, 'utf8');

const bannerRegex = /(\{\/\* --- EXAM ASSISTANT CTA --- \*\/\}.*?<\/section>)/s;
const match = txt.match(bannerRegex);

if (match) {
  const bannerContent = match[0];
  txt = txt.replace(bannerContent, '');
  const insertTarget = '{/* --- CBE/KCSE CURRICULUM ALIGNMENT --- */}';
  txt = txt.replace(insertTarget, bannerContent + '\n\n            ' + insertTarget);
  fs.writeFileSync(path, txt);
  console.log('Moved Exam Assistant CTA.');
} else {
  console.log('Banner not found.');
}

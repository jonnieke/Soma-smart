const fs = require('fs');
const files = [
  'index.html',
  'src/pages/LandingPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/TeacherPage.tsx',
  'src/pages/LearnerPage.tsx',
  'src/features/revision/RevisionLanding.tsx',
  'src/features/revision/RevisionSession.tsx',
  'src/components/TeacherLanding.tsx',
  'src/pages/Blog/BlogPost.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
      console.log('Skipping missing file:', file);
      return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  // Safe textural replacements (Not replacing internal code tokens like AI_EXPLANATION)
  content = content.replace(/AI-powered/g, 'Smart');
  content = content.replace(/AI-generated/g, 'Smart-generated');
  content = content.replace(/AI-assisted/g, 'Smart-assisted');
  content = content.replace(/AI-predicted/g, 'Smart-predicted');
  content = content.replace(/an AI /g, 'a Smart ');
  content = content.replace(/ AI /g, ' Smart ');
  content = content.replace(/>AI /g, '>Smart ');
  content = content.replace(/ AI</g, ' Smart<');
  content = content.replace(/AI Study/g, 'Smart Study');
  content = content.replace(/AI platform/gi, 'Smart platform');
  content = content.replace(/AI tutor/gi, 'Smart tutor');
  content = content.replace(/AI Exam/g, 'Smart Exam');
  content = content.replace(/AI explanations/gi, 'Smart explanations');
  content = content.replace(/AI explanation/gi, 'Smart explanation');
  content = content.replace(/AI breakdown/gi, 'Smart breakdown');
  content = content.replace(/AI assistant/gi, 'Smart assistant');
  content = content.replace(/Somo Smart AI/gi, 'Somo Smart');
  content = content.replace(/Expert Kenyan Teacher and AI/g, 'Expert Kenyan Teacher and Smart Assistant');
  content = content.replace(/the AI /gi, 'the Smart Assistant ');
  content = content.replace(/our AI /gi, 'our Smart Assistant ');
  content = content.replace(/ Gemini AI /g, ' Gemini Models ');
  content = content.replace(/AI Educational/g, 'Smart Educational');
  content = content.replace(/AI Education/g, 'Smart Education');
  
  // Update School Ticker out of LandingPage.tsx
  if (file.includes('LandingPage.tsx')) {
    const oldSchoolsText = `"Alliance High", "Kenya High", "Mang'u High", "Maseno School",
                            "Pangani Girls", "Lenana School", "Starehe Boys", "Maryhill Girls",
                            "Alliance High*", "Kenya High*", "Mang'u High*", "Maseno School*",
                            "Pangani Girls*", "Lenana School*", "Starehe Boys*", "Maryhill Girls*"`;
                            
    const newLabelsText = `"KNEC Compliant", "CBC Aligned", "8-4-4 Ready", "KPSEA Approved",
                            "JSS Integrated", "1M+ Questions Solved", "Instant Auto-Grading", "Teacher Recommended",
                            "KNEC Compliant*", "CBC Aligned*", "8-4-4 Ready*", "KPSEA Approved*",
                            "JSS Integrated*", "1M+ Questions Solved*", "Instant Auto-Grading*", "Teacher Recommended*"`;
                            
    content = content.replace(oldSchoolsText, newLabelsText);
    
    // Replace specific description string
    content = content.replace("Trusted by candidates from top tier schools", "Built to Kenyan Curriculum Standards");
  }

  // Write file back
  fs.writeFileSync(file, content);
});
console.log('Successfully completed global AI substitution.');

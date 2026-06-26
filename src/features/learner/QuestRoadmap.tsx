import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Check,
  BookOpen,
  Sparkles,
  Play,
  Volume2,
  Award,
  ChevronRight,
  GraduationCap,
  Trophy,
  HelpCircle,
  TrendingUp,
  Brain,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EducationLevel } from '../../types';
import { syncMasteryToCloud } from '../../services/learnerMemoryService';
import { calculateTotalXP, calculateStreak } from '../../services/gamificationService';

// Seeding standard, beautiful curriculum pathways by level and subject
export const CURRICULUM_DATA: Record<
  EducationLevel,
  Record<string, { title: string; description: string; outline: string[]; masteryDefault: number }[]>
> = {
  [EducationLevel.JUNIOR]: {
    Mathematics: [
      { title: 'Counting & Numbers 🔢', description: 'Master number lines, counting up to 100, and basic place values.', outline: ['Number Lines', 'Place Value (Ones & Tens)', 'Comparing Numbers (<, >, =)', 'Skip Counting'], masteryDefault: 100 },
      { title: 'Fun Addition & Subtraction ➕', description: 'Learn single and double digit addition and subtraction with interactive blocks.', outline: ['Single Digit Addition', 'Subtraction with Objects', 'Double Digit Math', 'Word Problems'], masteryDefault: 85 },
      { title: 'Intro to Shapes & Geometry 📐', description: 'Explore circles, squares, triangles, and 3D shapes in our world.', outline: ['2D Shapes', '3D Shapes (Symmetric)', 'Perimeter Basics', 'Drawing Geometry'], masteryDefault: 0 },
      { title: 'Fractions Playground 🍕', description: 'Understand halves, thirds, and quarters using delicious pizza slices!', outline: ['Equal Parts', 'Identifying Fractions', 'Fractions on a Line', 'Adding Simple Fractions'], masteryDefault: 0 },
      { title: 'Time & Money Adventures ⏰', description: 'Learn to read clocks, count coins, and make smart spending decisions.', outline: ['Reading Analog Clocks', 'Hours and Minutes', 'Identifying Coins/Notes', 'Making Change'], masteryDefault: 0 },
    ],
    Science: [
      { title: 'My Wonderful Body & Senses 🧠', description: 'Learn about the five senses and how our amazing organs keep us moving.', outline: ['The Five Senses', 'Major Organs (Heart, Brain)', 'Healthy Eating', 'Exercise & Bones'], masteryDefault: 100 },
      { title: 'Animal Kingdoms & Habitats 🦁', description: 'Journey through deserts, rainforests, and oceans to meet fascinating creatures.', outline: ['Mammals, Birds & Reptiles', 'Herbivores vs Carnivores', 'Habitats & Adaptations', 'Food Chains'], masteryDefault: 80 },
      { title: 'Plant Power & Growth 🌱', description: 'Discover how seeds sprout, use sunlight for energy, and produce beautiful flowers.', outline: ['Parts of a Plant', 'Photosynthesis Intro', 'Life Cycle of a Seed', 'Pollination'], masteryDefault: 0 },
      { title: 'Weather & The Four Seasons ☀️', description: 'Explore rain, snow, sunshine, and why the seasons change over the year.', outline: ['Types of Weather', 'The Water Cycle', 'Earth’s Tilt & Seasons', 'Weather Safety'], masteryDefault: 0 },
      { title: 'Simple Machines & Forces ⚙️', description: 'Uncover how pulleys, levers, and gravity help us lift giant objects.', outline: ['Push and Pull Forces', 'Gravity Basics', 'Levers & Pulleys', 'Friction Playground'], masteryDefault: 0 },
    ],
    Languages: [
      { title: 'Alphabet & Phonics Fun 🔤', description: 'Master letter sounds, blends, and building your very first small words.', outline: ['Letter Sounds (A-Z)', 'Vowels and Consonants', 'Digraphs (ch, sh, th)', 'Sight Words'], masteryDefault: 100 },
      { title: 'Sentence Builder Adventure ✍️', description: 'Learn how to combine nouns, verbs, and adjectives to write beautiful stories.', outline: ['Nouns & Pronouns', 'Action Verbs', 'Adjectives (Descriptive)', 'Punctuation Basics'], masteryDefault: 90 },
      { title: 'Spelling Bee Practice 🐝', description: 'Conquer tricky words and homophones in a fun, interactive spelling quest.', outline: ['Plurals', 'Silent Letters', 'Homophones (Their/There)', 'Prefixes & Suffixes'], masteryDefault: 0 },
      { title: 'Reading Comprehension Journeys 📖', description: 'Read fascinating folk tales and unlock hidden clues by answering quest questions.', outline: ['Main Idea & Details', 'Character Clues', 'Setting the Scene', 'Predicting Outcomes'], masteryDefault: 0 },
    ],
  },
  [EducationLevel.SENIOR]: {
    Mathematics: [
      { title: 'Algebra Foundations 🧮', description: 'Solve for x, master linear equations, and work with algebraic inequalities.', outline: ['Linear Equations', 'Solving Inequalities', 'Systems of Equations', 'Factoring Expressions'], masteryDefault: 100 },
      { title: 'Quadratic Equations & Graphs 📈', description: 'Unlock parabolas, factoring, and the famous quadratic formula.', outline: ['Factoring Quadratics', 'The Quadratic Formula', 'Graphing Parabolas', 'Completing the Square'], masteryDefault: 85 },
      { title: 'Trigonometry Triangles 📐', description: 'Explore sine, cosine, tangent, and solve real-world distance problems.', outline: ['SOH CAH TOA', 'Sine & Cosine Rules', 'Trig Graphs', 'Trigonometric Identities'], masteryDefault: 40 },
      { title: 'Coordinate Geometry 🗺️', description: 'Calculate slopes, midpoint formulas, and analyze circle equations on a grid.', outline: ['Slope & Intercept', 'Distance & Midpoint', 'Equations of Lines', 'Circle Geometry'], masteryDefault: 0 },
      { title: 'Probability & Permutations 🎲', description: 'Calculate exact odds, permutations, combinations, and conditional statistics.', outline: ['Independent Events', 'Permutations & Combinations', 'Conditional Probability', 'Venn Diagrams & Sets'], masteryDefault: 0 },
    ],
    Physics: [
      { title: 'Forces, Motion & Newton’s Laws 🏎️', description: 'Master velocity, acceleration, gravity, and Newton’s laws of motion.', outline: ['Speed, Velocity & Accel', 'Newton’s 3 Laws', 'Friction & Normal Force', 'Momentum & Collisions'], masteryDefault: 100 },
      { title: 'Work, Energy & Power ⚡', description: 'Calculate kinetic/potential energy, mechanical advantage, and power output.', outline: ['Kinetic vs Potential Energy', 'Conservation of Energy', 'Work Done Formulas', 'Power Calculations'], masteryDefault: 70 },
      { title: 'Waves & Sound Mechanics 🌊', description: 'Understand frequency, amplitude, reflection, refraction, and the Doppler effect.', outline: ['Transverse & Longitudinal Waves', 'Wave Equation (v = fλ)', 'Reflection & Refraction', 'Doppler Effect'], masteryDefault: 0 },
      { title: 'Electricity & Circuit Quests 💡', description: 'Build virtual circuits with resistors, batteries, and master Ohm’s Law.', outline: ['Ohm’s Law (V = IR)', 'Series & Parallel Circuits', 'Electrical Power', 'Resistors & Capacitors'], masteryDefault: 0 },
      { title: 'Electromagnetism & Induction 🧲', description: 'Explore magnetic fields, solenoid forces, and electrical generator principles.', outline: ['Magnetic Fields', 'Electromagnetic Force', 'Faraday’s Law of Induction', 'Lenz’s Law'], masteryDefault: 0 },
    ],
    Languages: [
      { title: 'Grammar Mastery & Clauses 📝', description: 'Perfect complex sentences, subordinate clauses, and passive voice.', outline: ['Independent vs Dependent Clauses', 'Active vs Passive Voice', 'Subject-Verb Agreement', 'Subordinating Conjunctions'], masteryDefault: 100 },
      { title: 'Essay Writing & Structure ✍️', description: 'Craft compelling thesis statements, logical paragraphs, and strong arguments.', outline: ['Thesis Statement Crafting', 'PEEL Paragraph Method', 'Intro & Conclusion Hook', 'Transitions & Flow'], masteryDefault: 95 },
      { title: 'Literary Devices & Analysis 🎭', description: 'Analyze metaphors, allegories, irony, and author intent in classic texts.', outline: ['Metaphor & Simile', 'Irony & Foreshadowing', 'Theme & Tone', 'Character Arc Analysis'], masteryDefault: 0 },
      { title: 'Public Speaking & Rhetoric 🗣️', description: 'Learn persuasive speaking using ethos, pathos, logos, and speech pacing.', outline: ['Ethos, Pathos, Logos', 'Structuring a Speech', 'Body Language & Tone', 'Handling Q&A'], masteryDefault: 0 },
    ],
  },
  [EducationLevel.CAMPUS]: {
    Mathematics: [
      { title: 'Calculus: Limits & Derivatives 📉', description: 'Master limits, continuity, derivative rules, and tangent line slopes.', outline: ['Limit Laws', 'Chain Rule & Product Rule', 'Optimization Problems', 'Related Rates'], masteryDefault: 100 },
      { title: 'Calculus: Integrals & Area 📐', description: 'Find areas under curves, volumes of solids of revolution, and integration tricks.', outline: ['Riemann Sums', 'Fundamental Theorem', 'Substitution & Parts', 'Volumes of Revolution'], masteryDefault: 80 },
      { title: 'Linear Algebra & Vectors 🧮', description: 'Solve system matrices, determinants, eigenvalues, and vector space transforms.', outline: ['Matrix Operations', 'Determinants & Inverses', 'Vector Spaces', 'Eigenvalues & Eigenvectors'], masteryDefault: 20 },
      { title: 'Differential Equations 🌀', description: 'Solve first-order and second-order ODEs and model dynamic physical systems.', outline: ['Separable Equations', 'Integrating Factors', 'Homogeneous Equations', 'Laplace Transforms'], masteryDefault: 0 },
    ],
    Physics: [
      { title: 'Classical Mechanics & Calculus 🚀', description: 'Derive rotational dynamics, orbital mechanics, and Lagrangian principles.', outline: ['Rotational Kinematics', 'Angular Momentum', 'Kepler’s Laws', 'Lagrangian Mechanics Intro'], masteryDefault: 100 },
      { title: 'Thermodynamics & Entropy 🔥', description: 'Master Heat Engines, Carnot cycle, and the deep statistical meaning of Entropy.', outline: ['Laws of Thermo', 'Carnot Cycles', 'Entropy Calculations', 'Free Energy & Enthalpy'], masteryDefault: 75 },
      { title: 'Quantum Mechanics Foundations ⚛️', description: 'Discover wave-particle duality, Schrödinger’s equation, and quantum spin.', outline: ['Wave-Particle Duality', 'Schrödinger Equation', 'Wave Functions & Operators', 'Quantum Tunneling'], masteryDefault: 0 },
      { title: 'Electrodynamics & Maxwell’s Equations ⚡', description: 'Unify electricity and magnetism using advanced vector calculus and Maxwell.', outline: ['Gauss & Ampere Laws', 'Faraday’s Vector Form', 'Maxwell’s Equations', 'Electromagnetic Waves'], masteryDefault: 0 },
    ],
    Languages: [
      { title: 'Advanced Academic Writing 🎓', description: 'Structure peer-reviewed style research papers, methodology, and citations.', outline: ['Research Question Formulation', 'APA, MLA, Chicago Citations', 'Methodology Structure', 'Peer Review Response'], masteryDefault: 100 },
      { title: 'Critical Theory & Semiotics 🔍', description: 'Deconstruct media, literature, and culture using post-structuralism and semiotics.', outline: ['Semiotics (Signifier/Signified)', 'Post-Modern Deconstruction', 'Feminist & Marxist Critique', 'Psychoanalytic Theory'], masteryDefault: 60 },
      { title: 'Technical Writing & Reports 📊', description: 'Translate highly complex systems into clear, readable user manuals and reports.', outline: ['Audience Analysis', 'Document Design & API Docs', 'Usability Testing Reports', 'Technical Manuals'], masteryDefault: 0 },
    ],
  },
};

export type NodeState = 'COMPLETED' | 'ACTIVE' | 'LOCKED';

export interface VisualNode {
  id: string;
  title: string;
  description: string;
  outline: string[];
  mastery: number;
  state: NodeState;
  x: number; // Percentage horizontal position (0-100)
  y: number; // Pixels vertical position
}

const cleanTopicTitle = (title: string) =>
  title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();

interface QuestRoadmapProps {
  onStudyTopic: (topic: string) => void;
  onTakeQuiz: (topic: string) => void;
  onListenRecap: (topic: string) => void;
  cloudMemoryRow?: any;
}

export const QuestRoadmap: React.FC<QuestRoadmapProps> = ({
  onStudyTopic,
  onTakeQuiz,
  onListenRecap,
  cloudMemoryRow,
}) => {
  const { educationLevel, learnerHistory: history, masteryGraph, studentCode, studentProfile } = useApp();

  // Pick level subjects
  const levelSubjects = Object.keys(CURRICULUM_DATA[educationLevel] || CURRICULUM_DATA[EducationLevel.SENIOR]);
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const local = localStorage.getItem('soma_quest_active_subject');
    if (local && levelSubjects.includes(local)) return local;
    if (cloudMemoryRow?.last_subject && levelSubjects.includes(cloudMemoryRow.last_subject)) return cloudMemoryRow.last_subject;
    return levelSubjects[0] || 'Mathematics';
  });
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const subjectHistory = React.useMemo(() => {
    const selected = selectedSubject.toLowerCase();
    return (history || []).filter((activity: any) => {
      const haystack = `${activity.topic || ''} ${activity.details || ''}`.toLowerCase();
      return haystack.includes(selected);
    });
  }, [history, selectedSubject]);

  const subjectQuizScores = React.useMemo(() => {
    return subjectHistory
      .filter((activity: any) => activity.type === 'QUIZ' && typeof activity.score === 'number')
      .map((activity: any) => activity.score as number);
  }, [subjectHistory]);

  const subjectAverage = subjectQuizScores.length
    ? Math.round(subjectQuizScores.reduce((sum, score) => sum + score, 0) / subjectQuizScores.length)
    : 0;

  const recentStudyCount = subjectHistory.filter((activity: any) => activity.type === 'STUDY' || activity.type === 'EXPLANATION').length;
  const recentQuizCount = subjectQuizScores.length;

  const handleSelectNode = (node: VisualNode) => {
    setSelectedNode(node);
    localStorage.setItem('soma_quest_active_node', node.title);

    // Sync to cloud
    const resolvedStudentId = studentProfile?.id || studentCode || 'guest';
    if (resolvedStudentId !== 'guest') {
      const totalXP = calculateTotalXP(history || []);
      const streak = calculateStreak(history || []);
      syncMasteryToCloud(resolvedStudentId, node.title, selectedSubject, streak, totalXP, recentStudyCount + recentQuizCount);
    }
  };

  // Re-sync selected subject when education level changes
  useEffect(() => {
    const subjects = Object.keys(CURRICULUM_DATA[educationLevel] || CURRICULUM_DATA[EducationLevel.SENIOR]);
    if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
      const defaultSub = subjects[0];
      setSelectedSubject(defaultSub);
      localStorage.setItem('soma_quest_active_subject', defaultSub);
      localStorage.removeItem('soma_quest_active_node');
    }
    setSelectedNode(null);
  }, [educationLevel]);

  // Seed visual coordinates and states for nodes
  const rawNodes = CURRICULUM_DATA[educationLevel]?.[selectedSubject] || 
                   CURRICULUM_DATA[EducationLevel.SENIOR]?.[selectedSubject] || [];

  const visualNodes: VisualNode[] = rawNodes.map((node, index) => {
    // 1. Calculate horizontal position using alternating sine wave for beautiful winding effect
    const x = 50 + 26 * Math.sin(index * 1.6);
    // 2. Vertical position spacing out nodes by 150px
    const y = 80 + index * 160;

    // 3. Resolve actual mastery score from global app state
    // First check user's actual mastery graph, fallback to their history, and then default seeded value
    let mastery = 0;
    const cleanTitle = cleanTopicTitle(node.title);
    
    if (masteryGraph && typeof masteryGraph[cleanTitle] === 'number') {
      mastery = masteryGraph[cleanTitle];
    } else if (history) {
      // Find highest score in history for this topic
      const topicHistory = history.filter((h: any) => {
        const topic = String(h.topic || '').toLowerCase();
        return topic.includes(node.title.toLowerCase()) || topic.includes(cleanTitle.toLowerCase());
      });
      const highestQuizScore = topicHistory
        .filter((h: any) => h.type === 'QUIZ')
        .reduce((max: number, curr: any) => {
          try {
            const details = JSON.parse(curr.details || '{}');
            const score = typeof details.score === 'number' ? details.score : 0;
            return score > max ? score : max;
          } catch (_) {
            return max;
          }
        }, 0);
      if (highestQuizScore > 0) {
        mastery = highestQuizScore;
      }
    }

    // Determine state
    // Let's decide progression strictly:
    // First node index = 0 is always at least ACTIVE
    // A node is completed if its mastery is >= 75
    // A node is locked if the previous node in the list was not completed.
    return {
      id: `${selectedSubject}-${index}`,
      title: node.title,
      description: node.description,
      outline: node.outline,
      mastery,
      state: 'LOCKED', // placeholder
      x,
      y,
    };
  });

  // Calculate strict linear progression states
  let isPreviousCompleted = true;
  visualNodes.forEach((node, index) => {
    if (index === 0) {
      if (node.mastery >= 75) {
        node.state = 'COMPLETED';
        isPreviousCompleted = true;
      } else {
        node.state = 'ACTIVE';
        isPreviousCompleted = false;
      }
    } else {
      if (isPreviousCompleted) {
        if (node.mastery >= 75) {
          node.state = 'COMPLETED';
          isPreviousCompleted = true;
        } else {
          node.state = 'ACTIVE';
          isPreviousCompleted = false;
        }
      } else {
        node.state = 'LOCKED';
      }
    }
  });

  // Auto-select the active node initially so the user has an instant focus point
  useEffect(() => {
    const savedNodeTitle = localStorage.getItem('soma_quest_active_node') || cloudMemoryRow?.last_topic;
    let targetNode = null;
    
    if (savedNodeTitle) {
      const cleanSavedTitle = savedNodeTitle.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim().toLowerCase();
      targetNode = visualNodes.find(n => {
        const cleanNodeTitle = n.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim().toLowerCase();
        return cleanNodeTitle === cleanSavedTitle;
      });
    }

    if (!targetNode) {
      targetNode = visualNodes.find(n => n.state === 'ACTIVE') || visualNodes[0];
    }

    if (targetNode) {
      setSelectedNode(targetNode);
    }
  }, [selectedSubject, educationLevel]);

  // Height of SVG canvas based on nodes count
  const svgHeight = visualNodes.length > 0 ? visualNodes[visualNodes.length - 1].y + 100 : 500;
  const completedCount = visualNodes.filter(node => node.state === 'COMPLETED').length;
  const activeNode = visualNodes.find(node => node.state === 'ACTIVE') || visualNodes[0];
  const questProgress = visualNodes.length ? Math.round((completedCount / visualNodes.length) * 100) : 0;
  const nextMission = activeNode
    ? `Study ${cleanTopicTitle(activeNode.title)}, take one quiz, then repair missed questions.`
    : `Choose a ${selectedSubject} topic and complete one exam drill cycle.`;

  // Generate SVG path coordinate curves between nodes
  let pathD = '';
  visualNodes.forEach((node, idx) => {
    if (idx === 0) {
      pathD += `M ${node.x} ${node.y}`;
    } else {
      const prev = visualNodes[idx - 1];
      const cpY1 = prev.y + 70;
      const cpY2 = node.y - 70;
      pathD += ` C ${prev.x} ${cpY1}, ${node.x} ${cpY2}, ${node.x} ${node.y}`;
    }
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-100 font-sans w-full relative">
      {/* BACKGROUND PARTICLES EFFECT */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* LEFT TIMELINE SECTION */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 z-10 overflow-y-auto no-scrollbar relative min-w-0 max-h-screen lg:max-h-none">
        
        {/* HEADER & SUBJECT SWITCHER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Quest Map 🗺️
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Level: {educationLevel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Your Exam Drill Path
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-400">
              Follow one topic at a time: open the topic, solve a question, repair mistakes, then move forward.
            </p>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {levelSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setSelectedNode(null);
                  localStorage.setItem('soma_quest_active_subject', sub);
                  localStorage.removeItem('soma_quest_active_node');

                  // Fire-and-forget sync to cloud
                  const resolvedStudentId = studentProfile?.id || studentCode || 'guest';
                  if (resolvedStudentId !== 'guest') {
                    const totalXP = calculateTotalXP(history || []);
                    const streak = calculateStreak(history || []);
                    syncMasteryToCloud(resolvedStudentId, '', sub, streak, totalXP, recentStudyCount + recentQuizCount);
                  }
                }}
                className={`
                  px-4 py-2 text-xs font-black rounded-xl transition-all duration-300
                  ${selectedSubject === sub
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Path Progress', value: `${questProgress}%`, hint: `${completedCount}/${visualNodes.length} topics mastered` },
            { label: 'Current Drill', value: activeNode ? cleanTopicTitle(activeNode.title) : selectedSubject, hint: 'Best place to start today' },
            { label: 'Quiz Average', value: subjectAverage ? `${subjectAverage}%` : 'No quiz yet', hint: `${recentQuizCount} quiz records` },
            { label: 'Study Proof', value: String(recentStudyCount), hint: 'Study actions recorded' }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-950/70 border border-white/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="text-lg font-black text-white mt-1 line-clamp-1">{item.value}</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 mb-1">Today's 15-Minute Exam Drill</p>
              <p className="text-sm font-bold text-emerald-50">{nextMission}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {activeNode && (
                <button
                  onClick={() => onStudyTopic(activeNode.title)}
                  className="rounded-2xl bg-emerald-400 text-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-emerald-300 transition-colors"
                >
                  Open Topic
                </button>
              )}
              {activeNode && (
                <button
                  onClick={() => onTakeQuiz(activeNode.title)}
                  className="rounded-2xl bg-slate-950/80 border border-white/10 text-white px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-slate-950 transition-colors"
                >
                  Start Drill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ROADMAP ADVENTURE TIMELINE BOARD */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-slate-950/40 rounded-3xl border border-white/5 shadow-2xl p-4 min-h-[500px] overflow-visible"
        >
          {/* Timeline SVG Line */}
          {visualNodes.length > 0 && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ height: `${svgHeight}px` }}
              viewBox={`0 0 100 ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Backing Track Path (Grayscale/Dotted) */}
              <path
                d={pathD}
                fill="none"
                stroke="#334155"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="4 6"
                className="opacity-40"
              />
              {/* Glowing Dynamic Active Path */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
                className="opacity-80 transition-all duration-700"
              />
            </svg>
          )}

          {/* TOPIC BUBBLE NODES */}
          <div className="relative w-full" style={{ height: `${svgHeight}px` }}>
            {visualNodes.map((node, idx) => {
              const isSelected = selectedNode?.id === node.id;
              
              // Define node visual configurations
              let borderStyle = 'border-slate-800 bg-slate-950 text-slate-500';
              let iconStyle = 'bg-slate-900 text-slate-600';
              let titleStyle = 'text-slate-500';
              let isPulsing = false;

              if (node.state === 'COMPLETED') {
                borderStyle = 'border-amber-500/50 bg-gradient-to-br from-slate-900 to-amber-950/20 text-amber-400 shadow-lg shadow-amber-950/30';
                iconStyle = 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950';
                titleStyle = 'text-amber-200 font-bold';
              } else if (node.state === 'ACTIVE') {
                borderStyle = 'border-blue-500 bg-gradient-to-br from-slate-900 to-blue-950/40 text-blue-400 shadow-xl shadow-blue-500/20';
                iconStyle = 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
                titleStyle = 'text-white font-extrabold';
                isPulsing = true;
              }

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${node.x}%`,
                    top: `${node.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="z-10 flex flex-col items-center group cursor-pointer"
                  onClick={() => handleSelectNode(node)}
                >
                  {/* Outer Pulsing Glow rings for Active node */}
                  {isPulsing && (
                    <>
                      <div className="absolute w-20 h-20 bg-blue-500/10 rounded-full animate-ping pointer-events-none" />
                      <div className="absolute w-16 h-16 bg-blue-500/20 rounded-full animate-pulse pointer-events-none" />
                    </>
                  )}

                  {/* The Bubble Node Card */}
                  <motion.div
                    whileHover={{ scale: 1.1, y: -4 }}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center border-3 transition-all duration-300 relative
                      ${borderStyle}
                      ${isSelected ? 'ring-4 ring-offset-2 ring-indigo-500 ring-offset-slate-900' : ''}
                    `}
                  >
                    {node.state === 'COMPLETED' ? (
                      <Check className="w-6 h-6 stroke-[3.5]" />
                    ) : node.state === 'ACTIVE' ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}

                    {/* Step Index badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-800 text-[10px] font-black border border-white/10 flex items-center justify-center text-slate-300">
                      {idx + 1}
                    </span>
                  </motion.div>

                  {/* Simple Floating Text Title below node */}
                  <div className="mt-3 max-w-[140px] text-center pointer-events-none">
                    <p className={`text-xs truncate transition-colors group-hover:text-white ${titleStyle}`}>
                      {cleanTopicTitle(node.title)}
                    </p>
                    {node.state === 'COMPLETED' && (
                      <span className="text-[9px] font-black text-amber-500 tracking-wider uppercase">Mastered</span>
                    )}
                    {node.state === 'ACTIVE' && (
                      <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase animate-pulse">Today's Focus</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE DETAILS PANEL - Glassmorphism Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            className={`
              w-full lg:w-[380px] bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-white/10 p-6 lg:p-8 
              backdrop-blur-2xl flex flex-col shrink-0 z-20 relative lg:max-h-screen lg:overflow-y-auto lg:sticky lg:top-0
            `}
          >
            {/* Header badges */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Exam Drill
              </span>

              {/* Status pill */}
              <span className={`
                px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border
                ${selectedNode.state === 'COMPLETED'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : selectedNode.state === 'ACTIVE'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                    : 'bg-slate-900 text-slate-500 border-slate-800'}
              `}>
                {selectedNode.state}
              </span>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight">
              {cleanTopicTitle(selectedNode.title)}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
              {selectedNode.description}
            </p>

            {/* Mastery Score Progress widget */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Mastery Proof
                </span>
                <span className="text-xs font-black text-white">{selectedNode.mastery}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${selectedNode.mastery}%` }}
                />
              </div>
            </div>

            {/* Outline / What You'll Learn Checklist */}
            <div className="flex-1 flex flex-col mb-8">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-400" />
                What To Master
              </h3>
              <div className="space-y-2 bg-slate-900/30 p-3 rounded-2xl border border-white/5 flex-1 max-h-56 overflow-y-auto no-scrollbar">
                {selectedNode.outline.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/60 transition-colors"
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIMARY ACTIONS PANEL */}
            <div className="space-y-3">
              {selectedNode.state === 'LOCKED' ? (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 text-center">
                  <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">Focus topic comes first</p>
                  <p className="text-[10px] text-slate-500 mt-1">Score 75% or more on the active topic quiz to unlock this path cleanly.</p>
                </div>
              ) : (
                <>
                  {/* Action 1: Study Topic (Somo Smart Chat) */}
                  <button
                    onClick={() => onStudyTopic(selectedNode.title)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/15 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                    Open Explanation
                    <ChevronRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-all ml-auto" />
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Action 2: Take Quiz */}
                    <button
                      onClick={() => onTakeQuiz(selectedNode.title)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-2xl text-[11px] font-black text-slate-300 hover:text-white uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Past Paper Drill
                    </button>

                    {/* Action 3: Listen to Recap */}
                    <button
                      onClick={() => onListenRecap(selectedNode.title)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-2xl text-[11px] font-black text-slate-300 hover:text-white uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      Listen & Recall
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Completion Rule</p>
                    <div className="space-y-2">
                      {[
                        'Read or listen to the explanation',
                        'Take a short quiz immediately',
                        'Repair every missed question'
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-black flex items-center justify-center">{index + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

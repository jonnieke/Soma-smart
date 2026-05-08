/**
 * MasteryDashboard — Topic Mastery Progress Panel
 *
 * Shows Gabu their per-topic mastery scores, weak areas, strong areas,
 * and spaced repetition queue in a premium, gamified UI.
 *
 * This is what ChatGPT can NEVER show — a personalised academic profile
 * tied to the Kenyan curriculum.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Zap, BookOpen, ChevronRight, Clock,
  TrendingUp, TrendingDown, Star, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { SpacedRepetitionItem } from '../types';
import { getDueTopics, getUpcomingTopics } from '../services/spacedRepetitionService';

// -------------------------------------------------------------------------
// Animated SVG Mastery Ring
// -------------------------------------------------------------------------

interface MasteryRingProps {
  score: number;       // 0–100
  label: string;
  color: string;       // Tailwind color token e.g. "blue"
  size?: number;
  delay?: number;
}

const COLORS: Record<string, { stroke: string; text: string; bg: string; badge: string }> = {
  blue:    { stroke: '#3b82f6', text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  emerald: { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  amber:   { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  purple:  { stroke: '#8b5cf6', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10',  badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  rose:    { stroke: '#f43f5e', text: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-500/10',    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  cyan:    { stroke: '#06b6d4', text: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-500/10',    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
};

const MasteryRing: React.FC<MasteryRingProps> = ({ score, label, color, size = 80, delay = 0 }) => {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;
  const c = COLORS[color] ?? COLORS.blue;

  const getScoreLabel = (s: number) => s >= 80 ? 'Expert' : s >= 60 ? 'Good' : s >= 40 ? 'Learning' : s > 0 ? 'Beginner' : 'Not started';

  return (
    <motion.div
      className="flex flex-col items-center gap-2 min-w-0"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: 'spring' }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={c.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black ${c.text}`}>{score}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{label}</p>
        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{getScoreLabel(score)}</p>
      </div>
    </motion.div>
  );
};

// -------------------------------------------------------------------------
// Topic Row (weak/strong list items)
// -------------------------------------------------------------------------

interface TopicRowProps {
  topic: string;
  score: number;
  isWeak: boolean;
  onPractice: (topic: string) => void;
  delay?: number;
}

const TopicRow: React.FC<TopicRowProps> = ({ topic, score, isWeak, onPractice, delay = 0 }) => (
  <motion.div
    className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
    initial={{ opacity: 0, x: isWeak ? -10 : 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
  >
    <div className="flex items-center gap-2 min-w-0">
      {isWeak
        ? <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
        : <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      }
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{topic}</span>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isWeak ? 'bg-rose-400' : 'bg-emerald-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8 }}
        />
      </div>
      <span className="text-xs font-bold text-slate-500 w-8 text-right">{score}%</span>
      {isWeak && (
        <button
          onClick={() => onPractice(topic)}
          className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wide flex-shrink-0"
        >
          Fix →
        </button>
      )}
    </div>
  </motion.div>
);

// -------------------------------------------------------------------------
// Due Review Item
// -------------------------------------------------------------------------

const ReviewCard: React.FC<{ item: SpacedRepetitionItem; onReview: (topic: string) => void; delay: number }> = ({ item, onReview, delay }) => {
  const isOverdue = new Date(item.nextReviewDate) < new Date();
  return (
    <motion.button
      onClick={() => onReview(item.topic)}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-left hover:scale-[1.01] active:scale-[0.99] ${
        isOverdue
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40'
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Clock className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-rose-500' : 'text-amber-500'}`} />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.topic}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isOverdue ? 'bg-rose-200 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' : 'bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'}`}>
          {isOverdue ? 'OVERDUE' : 'DUE SOON'}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </motion.button>
  );
};

// -------------------------------------------------------------------------
// Main Component
// -------------------------------------------------------------------------

interface MasteryDashboardProps {
  masteryGraph: Record<string, number>;
  srItems: SpacedRepetitionItem[];
  streak: number;
  totalXP: number;
  onClose: () => void;
  onPractice: (topic: string) => void;  // Opens quiz for a given topic
}

const SUBJECT_COLORS: Record<string, string> = {
  math: 'blue', mathematics: 'blue',
  english: 'emerald',
  kiswahili: 'purple', swahili: 'purple',
  science: 'amber', biology: 'amber', chemistry: 'amber', physics: 'amber',
  history: 'rose', geography: 'rose', 'social studies': 'rose',
  default: 'cyan',
};

const getTopicColor = (topic: string): string => {
  const t = topic.toLowerCase();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (t.includes(key)) return color;
  }
  return SUBJECT_COLORS.default;
};

export const MasteryDashboard: React.FC<MasteryDashboardProps> = ({
  masteryGraph, srItems, streak, totalXP, onClose, onPractice
}) => {
  const allTopics = Object.entries(masteryGraph).sort(([, a], [, b]) => b - a);
  const weakTopics = allTopics.filter(([, s]) => s < 50).slice(0, 6);
  const strongTopics = allTopics.filter(([, s]) => s >= 70).slice(0, 6);
  const dueTopics = useMemo(() => getDueTopics(srItems).slice(0, 5), [srItems]);
  const upcomingTopics = useMemo(() => getUpcomingTopics(srItems, 3).slice(0, 3), [srItems]);

  // Pick top 6 topics for the ring display (most studied)
  const ringTopics = allTopics.slice(0, 6);
  const overallMastery = allTopics.length > 0
    ? Math.round(allTopics.reduce((sum, [, s]) => sum + s, 0) / allTopics.length)
    : 0;

  const hasNoData = allTopics.length === 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 flex-shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">My Progress</h2>
              <p className="text-white/80 text-sm font-medium">
                {hasNoData ? 'Start learning to build your profile' : `${allTopics.length} topics tracked · ${overallMastery}% avg mastery`}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative mt-5 grid grid-cols-3 gap-3">
            {[
              { icon: '🔥', value: `${streak}`, label: 'Day Streak' },
              { icon: '⭐', value: `${totalXP}`, label: 'XP Points' },
              { icon: '🎯', value: `${overallMastery}%`, label: 'Avg Mastery' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="bg-white/15 border border-white/20 rounded-2xl p-3 text-center">
                <div className="text-lg mb-0.5">{icon}</div>
                <div className="text-lg font-black text-white leading-none">{value}</div>
                <div className="text-[10px] text-white/70 font-bold uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {hasNoData ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-lg font-black text-slate-700 dark:text-white mb-2">No progress yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Complete your first quiz or study session to start building your mastery profile.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
              >
                Start Learning →
              </button>
            </div>
          ) : (
            <>
              {/* Mastery Rings */}
              {ringTopics.length > 0 && (
                <section>
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Topic Mastery
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {ringTopics.map(([topic, score], i) => (
                      <MasteryRing
                        key={topic}
                        score={score}
                        label={topic.split(' ').slice(0, 2).join(' ')}
                        color={getTopicColor(topic)}
                        size={80}
                        delay={i * 0.08}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Due for Review */}
              {(dueTopics.length > 0 || upcomingTopics.length > 0) && (
                <section>
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Review Queue
                  </h3>
                  <div className="space-y-2">
                    {[...dueTopics, ...upcomingTopics].map((item, i) => (
                      <ReviewCard
                        key={item.topic}
                        item={item}
                        onReview={onPractice}
                        delay={i * 0.06}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Weak Topics */}
              {weakTopics.length > 0 && (
                <section>
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Needs Work
                  </h3>
                  <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl px-4 py-1 border border-rose-100 dark:border-rose-900/40">
                    {weakTopics.map(([topic, score], i) => (
                      <TopicRow
                        key={topic}
                        topic={topic}
                        score={score}
                        isWeak={true}
                        onPractice={onPractice}
                        delay={i * 0.05}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Strong Topics */}
              {strongTopics.length > 0 && (
                <section>
                  <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> Your Strengths 🏆
                  </h3>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl px-4 py-1 border border-emerald-100 dark:border-emerald-900/40">
                    {strongTopics.map(([topic, score], i) => (
                      <TopicRow
                        key={topic}
                        topic={topic}
                        score={score}
                        isWeak={false}
                        onPractice={onPractice}
                        delay={i * 0.05}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Bottom padding for mobile */}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
};

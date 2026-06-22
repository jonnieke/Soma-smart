import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Map,
  Brain,
  BookOpen,
  BookMarked,
  Users,
  FolderOpen,
  BarChart3,
  MessageCircle,
  X,
  Menu,
  GraduationCap,
  School,
  ChevronDown,
  LogOut,
  UserCircle,
  Sparkles,
  Settings,
  Crown,
  Star,
  ScanLine,
  Lock,
  Mic,
  Gift,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { EducationLevel } from '../types';
import { launchFeatures } from '../config/launchFeatures';

export type SidebarTab =
  | 'HOME'
  | 'SMART_TUTOR'
  | 'NOTEBOOK'
  | 'QUEST_MAP'
  | 'SUBJECTS'
  | 'EXAM_ROOMS'
  | 'HOMEWORK'
  | 'RESOURCES'
  | 'PROGRESS'
  | 'COMMUNITY'
  | 'TALKBACK'
  | 'REFERRAL';

interface NavItem {
  id: SidebarTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  comingSoon?: boolean;
  section?: 'primary' | 'secondary';
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onLogout?: () => void;
  onProfile?: () => void;
}

// Build level-aware nav — same tab IDs, contextual labels per level
const getNavItems = (level: EducationLevel): NavItem[] => {
  switch (level) {
    case EducationLevel.JUNIOR:
      return [
        { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" />, section: 'primary' },
        { id: 'SMART_TUTOR', label: 'Akili Buddy 🤝', icon: <Sparkles className="w-5 h-5" />, section: 'primary' },
        { id: 'NOTEBOOK', label: 'My Notebook', icon: <BookMarked className="w-5 h-5" />, section: 'primary' },
        { id: 'QUEST_MAP', label: 'Quest Map 🗺️', icon: <Map className="w-5 h-5" />, section: 'primary' },
        { id: 'SUBJECTS', label: 'Exam Prep', icon: <BookOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'RESOURCES', label: 'Library 📚', icon: <FolderOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'PROGRESS', label: 'My Stars ⭐', icon: <Star className="w-5 h-5" />, section: 'primary' },
        { id: 'TALKBACK', label: 'Talk & Play 🎙️', icon: <Mic className="w-5 h-5" />, section: 'secondary' },
        { id: 'EXAM_ROOMS', label: 'Study Pals', icon: <Users className="w-5 h-5" />, section: 'secondary' },
      ];
    case EducationLevel.CAMPUS:
      return [
        { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" />, section: 'primary' },
        { id: 'SMART_TUTOR', label: 'Ask Akili', icon: <ScanLine className="w-5 h-5" />, section: 'primary' },
        { id: 'NOTEBOOK', label: 'My Notebook', icon: <BookMarked className="w-5 h-5" />, section: 'primary' },
        { id: 'QUEST_MAP', label: 'Quest Map 🗺️', icon: <Map className="w-5 h-5" />, section: 'primary' },
        { id: 'SUBJECTS', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'RESOURCES', label: 'Research Hub', icon: <FolderOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'PROGRESS', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, section: 'primary' },
        { id: 'TALKBACK', label: 'Voice Study', icon: <Mic className="w-5 h-5" />, section: 'secondary' },
        { id: 'EXAM_ROOMS', label: 'Study Groups', icon: <Users className="w-5 h-5" />, section: 'secondary' },
        { id: 'COMMUNITY', label: 'Forum', icon: <MessageCircle className="w-5 h-5" />, section: 'secondary' },
      ];
    default: // SENIOR
      return [
        { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" />, section: 'primary' },
        { id: 'SMART_TUTOR', label: 'Ask Akili', icon: <Brain className="w-5 h-5" />, section: 'primary' },
        { id: 'NOTEBOOK', label: 'My Notebook', icon: <BookMarked className="w-5 h-5" />, section: 'primary' },
        { id: 'QUEST_MAP', label: 'Quest Map 🗺️', icon: <Map className="w-5 h-5" />, section: 'primary' },
        { id: 'SUBJECTS', label: 'Exam Hall', icon: <BookOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'RESOURCES', label: 'Library', icon: <FolderOpen className="w-5 h-5" />, section: 'primary' },
        { id: 'PROGRESS', label: 'Progress', icon: <BarChart3 className="w-5 h-5" />, section: 'primary' },
        { id: 'TALKBACK', label: 'Talk & Learn', icon: <Mic className="w-5 h-5" />, section: 'secondary' },
        { id: 'EXAM_ROOMS', label: 'Study Groups', icon: <Users className="w-5 h-5" />, section: 'secondary' },
        { id: 'COMMUNITY', label: 'Community', icon: <MessageCircle className="w-5 h-5" />, section: 'secondary' },
      ];
  }
};

const levelConfig: Record<
  EducationLevel,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  [EducationLevel.JUNIOR]: {
    label: 'Junior',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    icon: <BookOpen className="w-4 h-4" />,
  },
  [EducationLevel.SENIOR]: {
    label: 'Senior',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    icon: <School className="w-4 h-4" />,
  },
  [EducationLevel.CAMPUS]: {
    label: 'Campus',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    icon: <GraduationCap className="w-4 h-4" />,
  },
};

const simplifyLearnerNavItems = (items: NavItem[]): NavItem[] => {
  const labelById: Partial<Record<SidebarTab, string>> = {
    HOME: 'Home',
    SMART_TUTOR: 'Ask Akili',
    NOTEBOOK: 'My Notebook',
    RESOURCES: 'Library',
    SUBJECTS: 'Exam Prep',
    PROGRESS: 'Progress',
    TALKBACK: 'Talk & Learn',
    QUEST_MAP: 'Quest Map',
    EXAM_ROOMS: 'Study Groups',
    COMMUNITY: 'Community',
    REFERRAL: 'Referral',
  };

  const primaryOrder: SidebarTab[] = ['HOME', 'SMART_TUTOR', 'NOTEBOOK', 'RESOURCES', 'SUBJECTS', 'PROGRESS'];
  const secondaryOrder: SidebarTab[] = ['TALKBACK', 'QUEST_MAP', 'EXAM_ROOMS', 'COMMUNITY', 'REFERRAL'];
  const order = [...primaryOrder, ...secondaryOrder];

  return [...items]
    .filter((item) => {
      if (item.id === 'EXAM_ROOMS') return launchFeatures.examRooms;
      if (item.id === 'COMMUNITY') return launchFeatures.community;
      if (item.id === 'TALKBACK') return launchFeatures.talkAndLearn;
      if (item.id === 'NOTEBOOK') return launchFeatures.notebook;
      return true;
    })
    .map((item) => ({
      ...item,
      label: labelById[item.id] || item.label,
      section: primaryOrder.includes(item.id) ? 'primary' as const : 'secondary' as const,
    }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
};


export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  onLogout,
  onProfile,
}) => {
  const { studentProfile, educationLevel, setEducationLevel, isPro, isRegistered } = useApp();
  const [showLevelPicker, setShowLevelPicker] = React.useState(false);
  const [showMoreTools, setShowMoreTools] = React.useState(false);

  const currentLevel = levelConfig[educationLevel] || levelConfig[EducationLevel.SENIOR];
  const levelNavItems = simplifyLearnerNavItems(getNavItems(educationLevel));
  const primaryNavItems = levelNavItems.filter((item) => item.section !== 'secondary');
  const secondaryNavItems = levelNavItems.filter((item) => item.section === 'secondary');

  React.useEffect(() => {
    if (secondaryNavItems.some((item) => item.id === activeTab)) {
      setShowMoreTools(true);
    }
  }, [activeTab, educationLevel]);


  const handleTabClick = (item: NavItem) => {
    if (item.comingSoon) return;
    onTabChange(item.id);
    // Auto-close on mobile
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  // Sidebar content (shared between mobile overlay and desktop fixed)
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a1930] text-slate-300">
      {/* Logo & Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Somo Smart</h1>
              <p className="text-[10px] text-blue-200 font-medium">Powered by Akili ✨</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Education Level Switcher */}
      <div className="px-4 py-3">
        <button
          onClick={() => !isRegistered && setShowLevelPicker(!showLevelPicker)}
          disabled={isRegistered}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 transition-all ${isRegistered ? 'opacity-75 cursor-not-allowed' : 'hover:bg-white/10'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{currentLevel.icon}</span>
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 text-blue-200">
                {isRegistered ? 'Profile Level' : 'Switch Level'}
              </span>
              <span className="text-sm font-bold text-white">{currentLevel.label}</span>
            </div>
          </div>
          {isRegistered ? (
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${showLevelPicker ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        <AnimatePresence>
          {showLevelPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1 overflow-hidden"
            >
              {Object.entries(levelConfig)
                .filter(([level]) => level !== EducationLevel.CAMPUS || launchFeatures.campus)
                .map(([level, config]) => (
                <button
                  key={level}
                  onClick={() => {
                    setEducationLevel(level as EducationLevel);
                    setShowLevelPicker(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    educationLevel === level
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {config.icon}
                  <span>{config.label}</span>
                  {educationLevel === level && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-current" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Daily Tools
        </div>
        {primaryNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              disabled={item.comingSoon}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : item.comingSoon
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-white' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.comingSoon && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">
                  Soon
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {secondaryNavItems.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowMoreTools((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>More tools</span>
              <ChevronDown
                className={`w-4 h-4 ml-auto transition-transform ${showMoreTools ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {showMoreTools && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-1 space-y-1"
                >
                  {secondaryNavItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item)}
                        disabled={item.comingSoon}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : item.comingSoon
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className={`transition-colors ${isActive ? 'text-white' : ''}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-secondary"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Referral CTA */}
      {!isPro && isRegistered && (
        <div className="px-4 pb-2">
          <button
            onClick={() => {
              onTabChange('REFERRAL');
              if (window.innerWidth < 1024) onToggle();
            }}
            className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-900/20 hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-100 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-wider">Earn Free Pro</span>
                <span className="text-[10px] text-orange-100 font-medium">Invite 1 Friend</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-200 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Pro Badge / User Section */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        {isPro && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-500">Somo Pro</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {studentProfile?.name || 'Guest'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {studentProfile?.grade || 'Not registered'}
            </p>
          </div>
          <div className="flex gap-1">
            {isRegistered && onProfile && (
              <button
                onClick={onProfile}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Profile"
              >
                <Settings className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            )}
            {isRegistered && onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-[#0a1930]/90 backdrop-blur-sm shadow-lg border border-white/10 hover:bg-[#1a2e4d] transition-all"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar (overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-[70] h-full w-[280px] bg-[#0a1930] shadow-2xl lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (fixed) */}
      <aside className="hidden bg-[#0a1930] lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex lg:min-h-screen lg:w-[260px] lg:flex-col border-r border-white/10">
        {sidebarContent}
      </aside>
    </>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Brain, BookOpen, Users, ClipboardList, FolderOpen, BarChart3,
    MessageCircle, X, Menu, GraduationCap, School, ChevronDown, LogOut,
    UserCircle, Sparkles, Settings, Crown, Star, ScanLine, Lock, Mic, Gift, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EducationLevel } from '../types';

export type SidebarTab =
    | 'HOME'
    | 'SMART_TUTOR'
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
}

interface DashboardSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
    onLogout?: () => void;
    onProfile?: () => void;
}

const navItems: NavItem[] = [
    { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'SMART_TUTOR', label: 'Smart Tutor', icon: <Brain className="w-5 h-5" /> },
    { id: 'TALKBACK', label: 'Talk & Learn', icon: <Mic className="w-5 h-5" /> },
    { id: 'SUBJECTS', label: 'Subjects', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'EXAM_ROOMS', label: 'Exam Rooms', icon: <Users className="w-5 h-5" /> },
    { id: 'HOMEWORK', label: 'Homework', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'RESOURCES', label: 'Resources', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'PROGRESS', label: 'Progress', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'COMMUNITY', label: 'Community', icon: <MessageCircle className="w-5 h-5" /> },
];

const getLevelSpecificNavItems = (level: EducationLevel): NavItem[] => {
    switch (level) {
        case EducationLevel.JUNIOR:
            return [
                { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" /> },
                { id: 'SMART_TUTOR', label: 'Helper Buddy', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
                { id: 'TALKBACK', label: 'Talk & Play', icon: <Mic className="w-5 h-5 text-pink-500" /> },
                { id: 'SUBJECTS', label: 'My Classes', icon: <BookOpen className="w-5 h-5" /> },
                { id: 'HOMEWORK', label: 'Fun Tasks', icon: <ClipboardList className="w-5 h-5" /> },
                { id: 'RESOURCES', label: 'Library', icon: <FolderOpen className="w-5 h-5" /> },
                { id: 'PROGRESS', label: 'My Stars', icon: <Star className="w-5 h-5 text-amber-500" /> },
            ];
        case EducationLevel.CAMPUS:
            return [
                { id: 'HOME', label: 'Home', icon: <Home className="w-5 h-5" /> },
                { id: 'SMART_TUTOR', label: 'AI Researcher', icon: <ScanLine className="w-5 h-5" /> },
                { id: 'TALKBACK', label: 'Talk & Learn', icon: <Mic className="w-5 h-5" /> },
                { id: 'SUBJECTS', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
                { id: 'EXAM_ROOMS', label: 'Study Groups', icon: <Users className="w-5 h-5" /> },
                { id: 'HOMEWORK', label: 'Assignments', icon: <ClipboardList className="w-5 h-5" /> },
                { id: 'RESOURCES', label: 'Thesis Hub', icon: <FolderOpen className="w-5 h-5" /> },
                { id: 'PROGRESS', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
                { id: 'COMMUNITY', label: 'Forum', icon: <MessageCircle className="w-5 h-5" /> },
            ];
        default: // SENIOR
            return navItems;
    }
};

const levelConfig: Record<EducationLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    [EducationLevel.JUNIOR]: {
        label: 'Junior',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
        icon: <BookOpen className="w-4 h-4" />
    },
    [EducationLevel.SENIOR]: {
        label: 'Senior',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        icon: <School className="w-4 h-4" />
    },
    [EducationLevel.CAMPUS]: {
        label: 'Campus',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 dark:bg-purple-900/30',
        icon: <GraduationCap className="w-4 h-4" />
    }
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    isOpen,
    onToggle,
    activeTab,
    onTabChange,
    onLogout,
    onProfile
}) => {
    const { studentProfile, educationLevel, setEducationLevel, isPro, isRegistered } = useApp();
    const [showLevelPicker, setShowLevelPicker] = React.useState(false);

    const currentLevel = levelConfig[educationLevel] || levelConfig[EducationLevel.SENIOR];

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
        <div className="flex flex-col h-full">
            {/* Logo & Brand */}
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Somo Smart</h1>
                            <p className="text-[10px] text-slate-400 font-medium">AI Learning Platform</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggle}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Education Level Switcher */}
            <div className="px-4 py-3">
                <button
                    onClick={() => !isRegistered && setShowLevelPicker(!showLevelPicker)}
                    disabled={isRegistered}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl ${currentLevel.bgColor} transition-all ${isRegistered ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                    <div className="flex items-center gap-2">
                        <span className={currentLevel.color}>{currentLevel.icon}</span>
                        <div className="flex flex-col items-start">
                            <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${currentLevel.color}`}>
                                {isRegistered ? 'Profile Level' : 'Switch Level'}
                            </span>
                            <span className={`text-sm font-bold ${currentLevel.color}`}>{currentLevel.label}</span>
                        </div>
                    </div>
                    {isRegistered ? (
                        <Lock className={`w-3.5 h-3.5 ${currentLevel.color} opacity-40`} />
                    ) : (
                        <ChevronDown className={`w-4 h-4 ${currentLevel.color} transition-transform ${showLevelPicker ? 'rotate-180' : ''}`} />
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
                            {Object.entries(levelConfig).map(([level, config]) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        setEducationLevel(level as EducationLevel);
                                        setShowLevelPicker(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${educationLevel === level
                                        ? `${config.bgColor} ${config.color} font-semibold`
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                {getLevelSpecificNavItems(educationLevel).map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item)}
                            disabled={item.comingSoon}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                                : item.comingSoon
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <span className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                            {item.comingSoon && (
                                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                    Soon
                                </span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-600"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Referral CTA */}
            {!isPro && isRegistered && (
                <div className="px-4 pb-2">
                    <button
                        onClick={() => {
                            onTabChange('REFERRAL');
                            if (window.innerWidth < 1024) onToggle();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-all group"
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
            <div className="px-4 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isPro && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Somo Pro</span>
                    </div>
                )}

                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
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
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Profile"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                        {isRegistered && onLogout && (
                            <button
                                onClick={onLogout}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4 text-slate-400 hover:text-red-500" />
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
                className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                aria-label="Toggle menu"
            >
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
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
                        className="lg:hidden fixed top-0 left-0 z-50 h-full w-[280px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl"
                    >
                        {sidebarContent}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar (fixed) */}
            <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:min-h-screen lg:bg-white lg:dark:bg-slate-950 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 lg:fixed lg:top-0 lg:left-0 lg:z-30">
                {sidebarContent}
            </aside>
        </>
    );
};

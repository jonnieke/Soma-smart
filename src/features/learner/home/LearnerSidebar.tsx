import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CheckSquare,
  ClipboardList,
  Gift,
  Home,
  Map,
  MessageCircle,
  Mic,
  PenTool,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import logo from '../../../assets/images/main_logo.png';
import { SidebarTab } from '../../../components/DashboardSidebar';

type LearnerSidebarProps = {
  isOpen: boolean;
  activeTab: SidebarTab;
  sessionsLeft: number;
  isPro?: boolean;
  subscriptionPlan?: string;
  onToggle: () => void;
  onTabChange: (tab: SidebarTab) => void;
  onProfile: () => void;
  onPlans: () => void;
  onParent: () => void;
};

type SidebarAction = {
  label: string;
  icon: React.ReactNode;
  tab?: SidebarTab;
  action?: () => void;
  badge?: React.ReactNode;
  highlight?: boolean;
};

export const LearnerSidebar: React.FC<LearnerSidebarProps> = ({
  isOpen,
  activeTab,
  sessionsLeft,
  isPro = false,
  onToggle,
  onTabChange,
  onProfile,
  onPlans,
  onParent,
}) => {
  const navigate = useNavigate();

  const choose = (tab: SidebarTab) => {
    onTabChange(tab);
    if (window.innerWidth < 1024) onToggle();
  };

  const primary: SidebarAction[] = [
    { label: 'Learn', icon: <Home />, tab: 'HOME' },
    { label: 'Practise', icon: <CheckSquare />, tab: 'SUBJECTS' },
    { label: 'Library', icon: <BookOpen />, tab: 'RESOURCES' },
    { label: 'My Progress', icon: <BarChart3 />, tab: 'PROGRESS' },
  ];

  const more: SidebarAction[] = [
    { label: 'Notebook', icon: <BookMarked />, tab: 'NOTEBOOK' },
    { label: 'Talk & Learn', icon: <Mic />, tab: 'TALKBACK' },
    { label: 'Study Groups', icon: <Users />, tab: 'EXAM_ROOMS' },
    { label: 'Quest Map', icon: <Map />, tab: 'QUEST_MAP' },
    { label: 'Community', icon: <MessageCircle />, tab: 'COMMUNITY' },
    {
      label: 'Class Assignments',
      icon: <ClipboardList />,
      action: () => {
        navigate('/learner/assessments');
        if (window.innerWidth < 1024) onToggle();
      },
    },
  ];

  const account: SidebarAction[] = [
    { label: 'Profile', icon: <UserCircle />, action: onProfile },
    {
      label: 'Plans & Credits',
      icon: <Sparkles />,
      action: onPlans,
      badge: (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EDE9FE] text-[11px] font-black text-[#5B3CEB]">
          {sessionsLeft}
        </span>
      ),
      highlight: false,
    },
    { label: 'Parent Connection', icon: <Users />, action: onParent },
    { label: 'Referral', icon: <Gift />, tab: 'REFERRAL' },
  ];

  const content = (
    <div className="flex h-full flex-col bg-white text-[#181829] border-r border-[#ECECF2]">
      {/* Brand Logo matching reference */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <button type="button" onClick={() => choose('HOME')} className="flex items-center gap-3 text-left">
          <img
            src="/learner-assets/soma-smart-owl.png"
            alt="Soma Smart"
            className="h-9 w-9 object-contain"
            width={36}
            height={36}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = logo; }}
          />
          <span>
            <strong className="block text-[15px] font-black tracking-tight text-[#181829]">SOMA SMART</strong>
            <span className="block text-[11px] font-medium text-[#7A8299]">Learn with Akili</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#626b87] hover:bg-[#f4f0ff] lg:hidden"
          aria-label="Close learner navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        {/* Main Nav Items */}
        <NavGroup items={primary} activeTab={activeTab} onChoose={choose} />

        {/* More Section */}
        <div>
          <p className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">More</p>
          <NavGroup items={more} activeTab={activeTab} onChoose={choose} />
        </div>

        {/* Account Section */}
        <div>
          <p className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Account</p>
          <NavGroup items={account} activeTab={activeTab} onChoose={choose} />
        </div>

        {/* Bottom Invite Card matching reference */}
        <div className="mt-4 rounded-2xl border border-[#EDE9FE] bg-gradient-to-b from-[#FAF8FF] to-white p-4 text-center shadow-sm relative overflow-hidden">
          <img
            src="/learner-assets/gift-box-invite.png"
            alt="Invite a friend"
            className="w-14 h-14 object-contain mx-auto mb-2"
          />
          <h4 className="font-bold text-sm text-[#181829]">Invite a friend</h4>
          <p className="text-xs text-[#71778E] mt-1 leading-snug">
            You both get bonus learning sessions!
          </p>
          <button
            type="button"
            onClick={() => choose('REFERRAL')}
            className="w-full mt-3 py-2.5 px-3 bg-[#5B3CEB] hover:bg-[#4D2ED4] text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Invite Now
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <nav aria-label="Learner navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primary.map(item => (
          <button key={item.tab} type="button" onClick={() => item.tab && onTabChange(item.tab)} aria-current={item.tab === activeTab ? 'page' : undefined} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold focus-visible:outline-indigo-600 ${item.tab === activeTab ? 'text-[#5B3CEB] bg-[#EDE9FE]' : 'text-slate-600'}`}>
            <span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>{item.label}
          </button>
        ))}
        <button type="button" onClick={onToggle} aria-label="More learner options" className="min-h-16 flex-1 text-xs font-semibold text-slate-600 focus-visible:outline-indigo-600">More</button>
      </nav>
      <AnimatePresence>
        {isOpen && <motion.button type="button" aria-label="Close learner navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onToggle} className="fixed inset-0 z-[60] bg-[#10143a]/40 backdrop-blur-sm lg:hidden" />}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className="fixed inset-y-0 left-0 z-[70] w-[280px] shadow-2xl lg:hidden">{content}</motion.aside>}
      </AnimatePresence>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] border-r border-[#e8e5f2] bg-white lg:block">{content}</aside>
    </>
  );
};

const NavGroup: React.FC<{ items: SidebarAction[]; activeTab: SidebarTab; onChoose: (tab: SidebarTab) => void }> = ({ items, activeTab, onChoose }) => (
  <div className="space-y-1">
    {items.map((item) => {
      const active = item.tab === activeTab;
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => item.tab ? onChoose(item.tab) : item.action?.()}
          aria-current={active ? 'page' : undefined}
          className={`relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
            item.highlight
              ? 'bg-amber-50/70 text-amber-900 border border-amber-200/80 hover:bg-amber-100/70 font-semibold'
              : active
              ? 'bg-[#EDE9FE] text-[#5B3CEB] font-bold shadow-xs'
              : 'text-[#4A5068] hover:bg-[#F5F4FA] font-medium'
          }`}
        >
          <span className={`[&>svg]:h-5 [&>svg]:w-5 ${active ? 'text-[#5B3CEB]' : 'text-[#6B7280]'}`}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
          {item.badge && <span className="ml-auto shrink-0">{item.badge}</span>}
        </button>
      );
    })}
  </div>
);


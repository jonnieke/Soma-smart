import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  CheckSquare,
  CreditCard,
  Gift,
  Home,
  Map,
  MessageCircle,
  Mic,
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
  subscriptionPlan,
  onToggle,
  onTabChange,
  onProfile,
  onPlans,
  onParent,
}) => {
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
  ];
  const account: SidebarAction[] = [
    { label: 'Profile', icon: <UserCircle />, action: onProfile },
    {
      label: isPro ? 'Upgrade / Manage Plan' : 'Unlock Unlimited',
      icon: isPro ? <ShieldCheck className="text-emerald-500" /> : <Sparkles className="text-amber-500 animate-pulse" />,
      action: onPlans,
      badge: isPro ? (
        <span className="flex h-5 items-center justify-center rounded-md bg-emerald-100 px-1.5 text-[10px] font-black text-emerald-800 uppercase">
          PRO
        </span>
      ) : sessionsLeft <= 0 ? (
        <span className="flex h-5 items-center justify-center rounded-md bg-rose-100 px-1.5 text-[10px] font-black text-rose-700">
          0 Left
        </span>
      ) : (
        <span className="flex h-5 items-center justify-center rounded-md bg-amber-100 px-1.5 text-[10px] font-black text-amber-800">
          {sessionsLeft} Left
        </span>
      ),
      highlight: !isPro,
    },
    { label: 'Parent Connection', icon: <Users />, action: onParent },
    { label: 'Referral', icon: <Gift />, tab: 'REFERRAL' },
  ];

  const content = (
    <div className="flex h-full flex-col bg-white text-[#151a42]">
      <div className="flex items-center justify-between px-5 py-6">
        <button type="button" onClick={() => choose('HOME')} className="flex items-center gap-3 text-left">
          <img src={logo} alt="Soma AI" className="h-10 w-10 object-contain" width={40} height={40} />
          <span>
            <strong className="block text-[15px] font-black tracking-[0]">SOMA AI</strong>
            <span className="block text-xs text-[#707893]">Learn with Akili</span>
          </span>
        </button>
        <button type="button" onClick={onToggle} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#626b87] hover:bg-[#f4f0ff] lg:hidden" aria-label="Close learner navigation"><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-5">
        <NavGroup items={primary} activeTab={activeTab} onChoose={choose} />
        <div className="mx-2 my-4 border-t border-[#e7e4f2]" />
        <p className="px-3 pb-2 text-xs font-medium text-[#6c748f]">More</p>
        <NavGroup items={more} activeTab={activeTab} onChoose={choose} />
        <div className="mx-2 my-4 border-t border-[#e7e4f2]" />
        <p className="px-3 pb-2 text-xs font-medium text-[#6c748f]">Account &amp; Plans</p>
        <NavGroup items={account} activeTab={activeTab} onChoose={choose} />
      </nav>

      {/* Prominent Subscription Card */}
      {!isPro ? (
        <div className="m-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 border-2 border-indigo-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
              {sessionsLeft <= 0 ? 'Limit Reached' : `${sessionsLeft} Free Sessions Left`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mb-2.5 leading-snug">
            {sessionsLeft <= 0
              ? 'Get unlimited step-by-step help, exams & audio notes.'
              : 'Passes start from just KES 20.'}
          </p>
          <button
            type="button"
            onClick={onPlans}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Unlock Pass from KES 20</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="m-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              {subscriptionPlan && subscriptionPlan !== 'FREE' ? `${subscriptionPlan} Plan Active` : 'Pro Active'}
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold mb-2">Unlimited learning access</p>
          <button
            type="button"
            onClick={onPlans}
            className="w-full py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            Upgrade / Extend Plan
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
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
          className={`relative flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
            item.highlight
              ? 'bg-amber-50/70 text-amber-900 border border-amber-200/80 hover:bg-amber-100/70'
              : active
              ? 'bg-[#f1edff] text-[#6938ef]'
              : 'text-[#343c60] hover:bg-[#faf9ff]'
          }`}
        >
          {active && <span className="absolute -left-3 h-8 w-1 rounded-r-full bg-[#6938ef]" />}
          <span className={`[&>svg]:h-5 [&>svg]:w-5 ${active ? 'text-[#6938ef]' : 'text-[#69728f]'}`}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
          {item.badge && <span className="ml-auto shrink-0">{item.badge}</span>}
        </button>
      );
    })}
  </div>
);


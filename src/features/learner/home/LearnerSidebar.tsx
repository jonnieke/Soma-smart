import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
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
  badge?: number;
};

export const LearnerSidebar: React.FC<LearnerSidebarProps> = ({
  isOpen,
  activeTab,
  sessionsLeft,
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
    { label: 'Plans & Credits', icon: <CreditCard />, action: onPlans, badge: sessionsLeft },
    { label: 'Parent Connection', icon: <Users />, action: onParent },
    { label: 'Referral', icon: <Gift />, tab: 'REFERRAL' },
  ];

  const content = (
    <div className="flex h-full flex-col bg-white text-[#151a42]">
      <div className="flex items-center justify-between px-5 py-6">
        <button type="button" onClick={() => choose('HOME')} className="flex items-center gap-3 text-left">
          <img src={logo} alt="Somo Smart" className="h-10 w-10 object-contain" width={40} height={40} />
          <span>
            <strong className="block text-[15px] font-black tracking-[0]">SOMO SMART</strong>
            <span className="block text-xs text-[#707893]">Learn with Akili</span>
          </span>
        </button>
        <button type="button" onClick={onToggle} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#626b87] hover:bg-[#f4f0ff] lg:hidden" aria-label="Close learner navigation"><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-5">
        <NavGroup items={primary} activeTab={activeTab} onChoose={choose} />
        <div className="mx-2 my-5 border-t border-[#e7e4f2]" />
        <p className="px-3 pb-2 text-xs font-medium text-[#6c748f]">More</p>
        <NavGroup items={more} activeTab={activeTab} onChoose={choose} />
        <div className="mx-2 my-5 border-t border-[#e7e4f2]" />
        <p className="px-3 pb-2 text-xs font-medium text-[#6c748f]">Account</p>
        <NavGroup items={account} activeTab={activeTab} onChoose={choose} />
      </nav>

      <div className="m-5 rounded-2xl border border-[#ded9f4] bg-[#faf9ff] p-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee9ff] text-[#6938ef]"><Gift className="h-6 w-6" /></span>
        <h3 className="mt-3 text-sm font-bold">Invite a friend</h3>
        <p className="mt-1 text-xs leading-5 text-[#68708a]">You both get bonus learning sessions!</p>
        <button type="button" onClick={() => choose('REFERRAL')} className="mt-4 min-h-11 w-full rounded-xl bg-[#6938ef] px-4 text-sm font-bold text-white hover:bg-[#5b2bd7]">Invite Now</button>
      </div>
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
          className={`relative flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${active ? 'bg-[#f1edff] text-[#6938ef]' : 'text-[#343c60] hover:bg-[#faf9ff]'}`}
        >
          {active && <span className="absolute -left-3 h-8 w-1 rounded-r-full bg-[#6938ef]" />}
          <span className={`[&>svg]:h-5 [&>svg]:w-5 ${active ? 'text-[#6938ef]' : 'text-[#69728f]'}`}>{item.icon}</span>
          <span>{item.label}</span>
          {typeof item.badge === 'number' && <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-[#eee9ff] px-1.5 text-xs font-bold text-[#6938ef]">{item.badge}</span>}
        </button>
      );
    })}
  </div>
);

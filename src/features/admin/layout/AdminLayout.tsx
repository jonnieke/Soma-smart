import React from 'react';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, Bell, BookOpen, ClipboardCheck, BarChart3, Brain, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
    authStatus?: 'idle' | 'authenticating' | 'authenticated' | 'failed';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange, onLogout, authStatus = 'idle' }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navItems = [
        { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'USERS', label: 'User Management', icon: <Users className="w-5 h-5" /> },
        { id: 'EXAMS', label: 'Past Papers', icon: <ClipboardCheck className="w-5 h-5" /> },
        { id: 'FINANCE', label: 'Financials', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'KNOWLEDGE', label: 'CBE Knowledge Base', icon: <BookOpen className="w-5 h-5 text-indigo-400" /> },
        { id: 'CURRICULUM', label: 'Curriculum & AI', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'ANALYTICS', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'STRATEGY_LAB', label: 'AI Strategy Lab', icon: <Brain className="w-5 h-5 text-purple-400" /> },
        { id: 'JOURNAL', label: 'Somo Journal', icon: <FileText className="w-5 h-5 text-amber-400" /> },
        { id: 'SETTINGS', label: 'System & Logs', icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="bg-slate-900 text-slate-300 flex-shrink-0 relative hidden md:flex flex-col border-r border-slate-800 transition-all duration-300"
            >
                <div className="p-6 flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        A
                    </div>
                    {isSidebarOpen && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-white text-lg tracking-tight">
                            Somo Admin
                        </motion.span>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'KNOWLEDGE') {
                                    navigate('/admin/knowledge');
                                } else {
                                    onTabChange(item.id);
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                : 'hover:bg-slate-800 hover:text-white'
                                } `}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {isSidebarOpen && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-nowrap">
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-8 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 hover:text-white"
                >
                    {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 z-[70] md:hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                                        A
                                    </div>
                                    <span className="font-bold text-white text-lg tracking-tight">
                                        Somo Admin
                                    </span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.id === 'KNOWLEDGE') {
                                                navigate('/admin/knowledge');
                                            } else {
                                                onTabChange(item.id);
                                            }
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                            : 'hover:bg-slate-800 hover:text-white'
                                            } `}
                                    >
                                        <span className="flex-shrink-0">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="p-4 border-t border-slate-800">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <LogOut className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-500 md:hidden hover:bg-slate-50 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize">
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Auth Status Badge */}
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${authStatus === 'authenticated' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            authStatus === 'authenticating' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                                authStatus === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${authStatus === 'authenticated' ? 'bg-emerald-500' :
                                authStatus === 'authenticating' ? 'bg-amber-500' :
                                    authStatus === 'failed' ? 'bg-red-500' :
                                        'bg-slate-300'
                                }`} />
                            {authStatus === 'authenticated' ? 'Secure Session' :
                                authStatus === 'authenticating' ? 'Authenticating...' :
                                    authStatus === 'failed' ? 'Auth Failed (401 Risk)' : 'No Session'}
                        </div>

                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                            AD
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative bg-slate-50 text-slate-900">
                    {children}
                </main>
            </div>
        </div>
    );
};

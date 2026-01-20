import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, Bell, BookOpen } from 'lucide-react';
import { ViewState } from '../../../types';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const navItems = [
        { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'USERS', label: 'User Management', icon: <Users className="w-5 h-5" /> },
        { id: 'FINANCE', label: 'Financials', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'CURRICULUM', label: 'Curriculum & AI', icon: <BookOpen className="w-5 h-5" /> },
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
                            Soma Admin
                        </motion.span>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
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

            {/* Mobile Sidebar Overlay would go here in a real app */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-slate-800 capitalize">
                        {navItems.find(i => i.id === activeTab)?.label}
                    </h2>
                    <div className="flex items-center gap-4">
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
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

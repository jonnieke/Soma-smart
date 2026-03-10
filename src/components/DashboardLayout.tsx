import React, { useState } from 'react';
import { DashboardSidebar, SidebarTab } from './DashboardSidebar';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeTab: SidebarTab;
    onTabChange?: (tab: SidebarTab) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    activeTab,
    onTabChange
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { logout } = useApp();

    const handleTabChange = (tab: SidebarTab) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            // Default navigation if not handled by parent
            switch (tab) {
                case 'HOME':
                    navigate('/learner');
                    break;
                case 'EXAM_ROOMS':
                    navigate('/exam-rooms');
                    break;
                // Add other global routes here as they are built
                default:
                    navigate('/learner');
                    break;
            }
        }
    };

    const handleLogout = () => {
        // We could show a modal here, but for simplicity in the layout wrapper we just logout
        if (window.confirm("Are you sure you want to log out?")) {
            logout();
            navigate('/');
        }
    };

    return (
        <div className="relative flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <DashboardSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
                onProfile={() => navigate('/learner')} // Could navigate to a specific profile route
            />

            <div className="flex-1 lg:ml-[260px] min-h-screen pt-16 lg:pt-0">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

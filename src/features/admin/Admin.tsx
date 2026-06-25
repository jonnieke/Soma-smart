import React, { useEffect, useState } from 'react';
import { ViewState } from '../../types';
import { AdminLayout } from './layout/AdminLayout';
import { Overview } from './views/Overview';
import { UsersView } from './views/Users';
import { FinancialsView } from './views/Financials';
import { SettingsView } from './views/Settings';
import { CurriculumView } from './views/Curriculum';
import { ExamsView } from './views/Exams';
import { AnalyticsView } from './views/Analytics';
import { StrategyLabView } from './views/StrategyLab';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Helmet } from 'react-helmet-async';
import { JournalView } from './views/Journal';
import { useLocation, useNavigate } from 'react-router-dom';

interface AdminProps {
    onNavigate: (view: ViewState) => void;
    authStatus?: 'idle' | 'authenticating' | 'authenticated' | 'failed';
}

export const AdminDashboard: React.FC<AdminProps> = ({ onNavigate, authStatus = 'idle' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>(() => new URLSearchParams(location.search).get('tab') || 'OVERVIEW');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const nextTab = params.get('tab') || 'OVERVIEW';
        setActiveTab((current) => current === nextTab ? current : nextTab);
    }, [location.search]);

    const handleTabChange = (nextTab: string) => {
        setActiveTab(nextTab);
        const params = new URLSearchParams(location.search);
        params.set('tab', nextTab);
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    };

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={handleTabChange}
            authStatus={authStatus}
            onLogout={async () => {
                await supabase.auth.signOut();
                window.location.reload();
            }}
        >
            <Helmet>
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-B49HNQCQTY"></script>
                <script>
                    {`
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());

                      gtag('config', 'G-B49HNQCQTY');
                    `}
                </script>
            </Helmet>
            {activeTab === 'OVERVIEW' && <Overview />}
            {activeTab === 'USERS' && <UsersView />}
            {activeTab === 'FINANCE' && <FinancialsView />}
            {activeTab === 'CURRICULUM' && <CurriculumView />}
            {activeTab === 'EXAMS' && <ExamsView />}
            {activeTab === 'ANALYTICS' && <AnalyticsView />}
            {activeTab === 'STRATEGY_LAB' && <StrategyLabView />}
            {activeTab === 'JOURNAL' && <JournalView />}
            {activeTab === 'SETTINGS' && <SettingsView />}
        </AdminLayout>
    );
};

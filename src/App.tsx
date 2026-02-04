import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LearnerPage } from './pages/LearnerPage';
import { TeacherPage } from './pages/TeacherPage';
import { ParentPage } from './pages/ParentPage';
import { AdminDashboard } from './features/admin/Admin';
import { RevisionPortal } from './features/revision/RevisionPortal';
import { AskSoma } from './components/AskSoma';
import { DarasaMode } from './features/darasa-mode/DarasaMode';
import { ResetPassword } from './pages/ResetPassword';
import { PricingPage } from './pages/PricingPage';

const DarasaPage = () => {
    const navigate = useNavigate();
    return <DarasaMode onBack={() => navigate('/teacher')} />;
};

const App: React.FC = () => {
    return (
        <Router>
            <AppProvider>
                <AskSoma />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/learner" element={<LearnerPage />} />
                    <Route path="/teacher" element={<TeacherPage />} />
                    <Route path="/parent" element={<ParentPage />} />
                    <Route path="/admin" element={<AdminDashboard onNavigate={() => window.location.href = '/'} />} />
                    <Route path="/revision" element={<RevisionPortal />} />
                    <Route path="/teacher/darasa" element={<DarasaPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppProvider>
        </Router>
    );
};

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LearnerPage } from './pages/LearnerPage';
import { TeacherPage } from './pages/TeacherPage';
import { ParentPage } from './pages/ParentPage';

const App: React.FC = () => {
    return (
        <Router>
            <AppProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/learner" element={<LearnerPage />} />
                    <Route path="/teacher" element={<TeacherPage />} />
                    <Route path="/parent" element={<ParentPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppProvider>
        </Router>
    );
};

export default App;

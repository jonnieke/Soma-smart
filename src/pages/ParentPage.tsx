import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ParentDashboard } from '../features/parent/Parent';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const ParentPage: React.FC = () => {
    const navigate = useNavigate();
    const { learnerHistory, studentCode, userId, loginParent } = useApp();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <>
            <Helmet>
                <title>Parent Portal | Somo Smart — Monitor Your Child's Learning</title>
                <meta name="description" content="Track your child's study progress, quiz scores, and learning activity on Somo Smart. Secure parent access with PIN verification." />
                <link rel="canonical" href="https://somaai.co.ke/parent" />
                <meta property="og:title" content="Parent Portal | Somo Smart" />
                <meta property="og:description" content="Monitor your child's learning progress on Somo Smart." />
                <meta property="og:url" content="https://somaai.co.ke/parent" />
            </Helmet>
            <ParentDashboard
                onNavigate={handleNavigate}
                activityLog={learnerHistory}
                validStudentCode={studentCode}
                studentId={userId}
                login={loginParent}
            />
        </>
    );
};

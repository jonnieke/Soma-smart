import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LearnerDashboard } from '../features/learner/Learner';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const LearnerPage: React.FC = () => {
    const navigate = useNavigate();
    const { studentCode, studentProfile, subscriptionPlan, subscriptionExpiry } = useApp();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <>
            <Helmet>
                <html lang="en" />
                <title>Study Dashboard | Somo Smart — AI Learning for Kenyan Students</title>
                <meta name="description" content="Your personalized AI study dashboard for Kenya. Ask homework questions, get step-by-step explanations, practice CBC, KPSEA & KCSE past papers, and track subject mastery." />
                <meta name="keywords" content="Somo Smart learner, KCSE revision, KPSEA past papers, CBC notes, Ask Akili AI, Kenyan study assistant, step-by-step homework help" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="educational-framework" content="CBC, KPSEA, KCSE, 8-4-4" />
                <meta name="target-audience" content="Kenyan Primary, Junior Secondary & Senior Secondary Learners" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph / Facebook */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Study Dashboard | Somo Smart — AI Learning for Kenyan Students" />
                <meta property="og:description" content="Personalized study dashboard with Ask Akili AI tutor, past papers, official notes, audio lessons, and progress tracking." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/learner" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@somasmart" />
                <meta name="twitter:title" content="Study Dashboard | Somo Smart" />
                <meta name="twitter:description" content="Step-by-step CBC, KPSEA & KCSE study assistance, past paper practice, and AI tutoring for Kenyan students." />

                <link rel="canonical" href="https://www.somaai.co.ke/learner" />

                {/* Structured Data (JSON-LD) for Search Console & AI Engines */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "EducationalApplication",
                        "name": "Somo Smart Learner Dashboard",
                        "operatingSystem": "Web, Mobile",
                        "applicationCategory": "EducationalApplication",
                        "url": "https://www.somaai.co.ke/learner",
                        "description": "Step-by-step CBC, KPSEA and KCSE study dashboard with AI tutoring, official library notes, and past paper revision.",
                        "educationalLevel": ["Primary", "Junior Secondary", "Senior Secondary"],
                        "inLanguage": ["en", "sw"],
                        "offers": {
                            "@type": "Offer",
                            "price": "20",
                            "priceCurrency": "KES",
                            "name": "Daily Learner Pass"
                        }
                    })}
                </script>
            </Helmet>

            <LearnerDashboard
                onNavigate={handleNavigate}
                profile={studentProfile ? { name: studentProfile.name, code: studentCode, subscriptionTier: subscriptionPlan, subscriptionExpiry: subscriptionExpiry } : null}
            />
        </>
    );
};

export default LearnerPage;

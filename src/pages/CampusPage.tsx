import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CampusDashboard } from '../features/campus/CampusDashboard';

export const CampusPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <html lang="en" />
                <title>Campus Hub | University &amp; College Study Tools Kenya — Somo Smart</title>
                <meta name="description" content="Smart study and research assistant for Kenyan university and college students. Essay writing feedback, PDF research summarizing, research citation, and academic tools." />
                <meta name="keywords" content="Kenyan university study assistant, college PDF summarizer, research paper feedback Kenya, Somo Smart campus hub" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="campus-hub" />
                <meta name="educational-framework" content="Higher Education, TVET, University" />
                <meta name="target-audience" content="University Students, TVET Students, Researchers" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Campus Hub | University &amp; College Study Tools — Somo Smart" />
                <meta property="og:description" content="AI research assistant, PDF summarizer, and essay feedback for university &amp; TVET students in Kenya." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/campus" />

                <link rel="canonical" href="https://www.somaai.co.ke/campus" />
            </Helmet>
            <CampusDashboard />
        </>
    );
};

export default CampusPage;

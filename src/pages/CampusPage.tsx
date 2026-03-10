import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CampusDashboard } from '../features/campus/CampusDashboard';

export const CampusPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Campus Dashboard | Somo Smart</title>
                <meta name="description" content="AI tools for university and college students: PDF summarizing, research assistance, and more." />
            </Helmet>
            <CampusDashboard />
        </>
    );
};

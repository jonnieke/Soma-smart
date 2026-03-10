import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExamRooms } from '../features/examrooms/ExamRooms';

export const ExamRoomsListPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Exam Rooms | Somo Smart</title>
                <meta name="description" content="Join collaborative study rooms and prep for exams with peers and AI." />
            </Helmet>
            <ExamRooms />
        </>
    );
};

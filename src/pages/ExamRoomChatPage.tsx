import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ExamRoomChat } from '../features/examrooms/ExamRoomChat';

export const ExamRoomChatPage: React.FC = () => {
    return (
        <>
            <Helmet>
                <title>Study Room | Somo Smart</title>
                <meta name="description" content="Collaborative study session." />
            </Helmet>
            <ExamRoomChat />
        </>
    );
};

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { expect, it, vi } from 'vitest';

vi.mock('../context/AppContext', () => ({ useApp: () => ({ isRegistered: false, role: null, teacherProfile: null }) }));
vi.mock('../features/teacher/Teacher', () => ({ TeacherDashboard: () => null }));
vi.mock('../features/teacher/paperStudio/PaperStudioWorkspace', () => ({ PaperStudioWorkspace: () => null }));
vi.mock('../features/teacher/paperStudio/CreatePaperWizard', () => ({ CreatePaperWizard: () => null }));
vi.mock('../features/teacher/paperStudio/ExaminationEditor', () => ({ ExaminationEditor: () => null }));
vi.mock('../features/teacher/paperStudio/QuestionBankBrowser', () => ({ QuestionBankBrowser: () => null }));
vi.mock('../features/teacher/paperStudio/SchoolWorkspace', () => ({ SchoolWorkspace: () => null }));
vi.mock('../features/teacher/paperBank/PaperBankMarketplace', () => ({ PaperBankMarketplace: () => null }));
vi.mock('../features/teacher/paperBank/SellerEarningsDashboard', () => ({ SellerEarningsDashboard: () => null }));
vi.mock('../components/RegistrationModal', () => ({ RegistrationModal: () => null }));
vi.mock('../types/teacherComposerHandoff', () => ({ loadTeacherComposerDraft: async () => null, markTeacherComposerDraftConsumed: vi.fn() }));
vi.mock('../services/analyticsEventService', () => ({ trackAnalyticsEvent: vi.fn() }));

import { TeacherPage } from '../pages/TeacherPage';

it.each(['Sign in', 'Sign in to workspace'])('%s on /teacher opens Teacher Login and stays correct on reopen', async name => {
    render(<HelmetProvider><MemoryRouter initialEntries={['/teacher']}><TeacherPage /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole('button', { name }));
    expect(await screen.findByRole('heading', { name: 'Teacher Login' })).toBeInTheDocument();
    expect(screen.getByText('Enter your email and password.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Student Login' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Student' }));
    expect(screen.getByRole('heading', { name: 'Student Login' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name }));
    expect(await screen.findByRole('heading', { name: 'Teacher Login' })).toBeInTheDocument();
});

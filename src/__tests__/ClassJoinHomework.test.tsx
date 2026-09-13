import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
vi.mock('../context/AppContext', () => ({ useApp: () => ({ studentProfile: { id: 'learner-1' }, isRegistered: true }) }));
vi.mock('../services/classroomService', () => ({ classroomService: {
    getClassById: vi.fn().mockResolvedValue({ id: 'class-1', name: 'Grade 6', subject: 'Maths' }),
    joinClass: vi.fn().mockResolvedValue({ success: true, alreadyJoined: true }),
    getClassStream: vi.fn().mockResolvedValue([{ id: 'assignment-1', post_type: 'ASSIGNMENT', content: 'Homework\n1. Half of eight?' }]),
} }));
import { ClassJoinPage } from '../pages/ClassJoinPage';
it('shows posted homework after a learner joins or rejoins the class link', async () => {
    render(<HelmetProvider><MemoryRouter initialEntries={['/class/class-1']}><Routes><Route path="/class/:classId" element={<ClassJoinPage />} /></Routes></MemoryRouter></HelmetProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Join Class' }));
    expect(await screen.findByText(/Half of eight/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your class work' })).toBeInTheDocument();
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const read = vi.hoisted(() => vi.fn());
vi.mock('../services/classroomService', () => ({ classroomService: { getClassStream: read } }));
import { ClassroomReadingStream } from '../components/ClassroomReadingStream';
describe('learner classroom reading', () => {
    beforeEach(() => vi.resetAllMocks());
    it('requests confirmed remote posts and displays the full assignment', async () => {
        read.mockResolvedValue([{ id: 'post-1', post_type: 'ASSIGNMENT', content: 'Fractions\n1. Half of eight?\n2. Half of ten?' }]);
        render(<ClassroomReadingStream classId="class-1" />);
        expect(await screen.findByText(/Half of ten/)).toHaveClass('whitespace-pre-wrap');
        expect(read).toHaveBeenCalledWith('class-1', true);
        expect(screen.getByText(/Online submission is not available/)).toBeInTheDocument();
    });
    it('distinguishes a failed load from an empty classroom and supports retry', async () => {
        read.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
        render(<ClassroomReadingStream classId="class-1" />);
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
        expect(screen.queryByText('No class work has been posted yet.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(await screen.findByText('No class work has been posted yet.')).toBeInTheDocument();
    });
});

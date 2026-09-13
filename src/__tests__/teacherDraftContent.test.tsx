import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTeacherDraftContent } from '../features/teacher/useTeacherDraftContent';

describe('teacher dashboard draft restoration', () => {
    it('shows notes arriving after the dashboard has already mounted', () => {
        const { result, rerender } = renderHook(
            ({ content }: { content?: string }) => useTeacherDraftContent(content),
            { initialProps: { content: undefined } as { content?: string } },
        );
        rerender({ content: 'Soil erosion is the removal of topsoil by water or wind.' });
        expect(result.current[0]).toBe('Soil erosion is the removal of topsoil by water or wind.');
        act(() => result.current[1]('My edited notes'));
        rerender({ content: undefined });
        expect(result.current[0]).toBe('My edited notes');
        rerender({ content: 'Soil erosion is the removal of topsoil by water or wind.' });
        expect(result.current[0]).toBe('My edited notes');
        rerender({ content: 'New photosynthesis notes' });
        expect(result.current[0]).toBe('New photosynthesis notes');
    });
});

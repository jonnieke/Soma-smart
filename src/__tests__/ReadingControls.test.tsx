import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReadingNavigation, ReadingToolbar, ReadingPager } from '../features/learner/home/ReadingControls';
afterEach(cleanup);
const toolbar = () => ({ sourceAvailable: true, view: 'guide' as const, onView: vi.fn(), originalType: 'text' as const, onOriginalType: vi.fn(), playing: false, busy: false, ready: true, onListen: vi.fn(), fontScale: 1, onFontScale: vi.fn(), fontFamily: 'sans' as const, onFontFamily: vi.fn(), search: '', onSearch: vi.fn() });
describe('Reading controls', () => {
  it('offers reading, help and practice with optional additional tools', () => {
    const onTab = vi.fn(); const onBack = vi.fn();
    render(<ReadingNavigation title="Fractions" subject="Mathematics" grade="Grade 7" tab="LESSON" onTab={onTab} onBack={onBack} />);
    expect(screen.getByRole('button', { name: 'Read' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Ask Akili' }));
    expect(onTab).toHaveBeenCalledWith('QNA');
    fireEvent.click(screen.getByRole('button', { name: 'Practise' }));
    expect(onTab).toHaveBeenCalledWith('QUIZ');
    fireEvent.click(screen.getByRole('button', { name: 'Back to subjects' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it('does not start audio before a guide is ready', () => {
    render(<ReadingToolbar {...toolbar()} ready={false} />);
    expect(screen.getByRole('button', { name: 'Listen' })).toBeDisabled();
  });
  it('labels the active audio action accurately', () => {
    const props = toolbar();
    render(<ReadingToolbar {...props} playing />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause audio' }));
    expect(props.onListen).toHaveBeenCalledOnce();
  });
  it('allows switching to source material without generating a new lesson', () => {
    const props = toolbar(); render(<ReadingToolbar {...props} />);
    fireEvent.change(screen.getByLabelText('Reading version'), { target: { value: 'original' } });
    expect(props.onView).toHaveBeenCalledWith('original');
    expect(props.onListen).not.toHaveBeenCalled();
  });
  it('hides the source selector when no document is available', () => {
    render(<ReadingToolbar {...toolbar()} sourceAvailable={false} />);
    expect(screen.queryByLabelText('Reading version')).toBeNull();
  });
  it('provides bounded page navigation and direct page selection', () => {
    const onPage = vi.fn();
    const { rerender } = render(<ReadingPager page={0} count={25} onPage={onPage} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPage).toHaveBeenCalledWith(1);
    fireEvent.change(screen.getByLabelText('Go to page'), { target: { value: '24' } });
    expect(onPage).toHaveBeenCalledWith(24);
    rerender(<ReadingPager page={24} count={25} onPage={onPage} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});

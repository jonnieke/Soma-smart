import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import LearningVideosPage from '../pages/LearningVideosPage';
import VideoHubEditor from '../components/VideoHubEditor';
import VideoLesson from '../components/VideoLesson';
import videos from '../data/learningVideoSeed.json';
import { validateStudy, youtubeId } from '../services/learningVideoService';
vi.mock('../services/videoGenerationService', () => ({
  listVideoGenerations: vi.fn(async () => []),
  getVideoGeneration: vi.fn(),
}));
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  isAdmin: vi.fn(),
  rating: vi.fn(),
  rate: vi.fn(),
  save: vi.fn(),
}));
vi.mock('../services/learningVideoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/learningVideoService')>()),
  learningVideoService: mocks,
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue(videos);
  mocks.isAdmin.mockResolvedValue(false);
  mocks.rating.mockResolvedValue({ average: null, count: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('replaces a stalled blank iframe with recovery actions and allows retry', async () => {
  vi.useFakeTimers();
  render(<VideoLesson video={videos[0]} playRequested />);
  expect(screen.getByText('Opening your video…')).toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(12000); });
  expect(screen.getByText('The video player could not open here')).toBeInTheDocument();
  expect(screen.queryByTitle(videos[0].title)).toBeNull();
  fireEvent.click(screen.getByText('Retry player'));
  expect(screen.getByTitle(videos[0].title)).toBeInTheDocument();
  expect(screen.getByText('Opening your video…')).toBeInTheDocument();
});
const setup = (url = '/learning-videos') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <HelmetProvider>
        <LearningVideosPage />
      </HelmetProvider>
    </MemoryRouter>
  );
it('searches lessons, clears empty results, and hides admin publishing', async () => {
  setup();
  await screen.findByText(`${videos.length} videos`);
  fireEvent.change(screen.getByLabelText('Search videos'), { target: { value: 'not-a-topic' } });
  expect(screen.getByText('No lessons match these filters.')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Clear filters'));
  expect(screen.getByRole('button', { name: /Respiratory System/ })).toBeInTheDocument();
  expect(screen.queryByText('Manage videos')).toBeNull();
});
it('opens share links to the selected lesson and never invents a transcript', async () => {
  setup('/learning-videos?video=M-elC3LZvno');
  await screen.findByRole('button', { name: 'Watch Respiratory System for CBE Learners' });
  expect(
    decodeURIComponent(
      screen.getByRole('link', { name: 'Share on WhatsApp' }).getAttribute('href')!
    )
  ).toContain('video=M-elC3LZvno');
  fireEvent.click(screen.getByRole('button', { name: 'Transcript' }));
  expect(screen.getByText('Transcript not published yet')).toBeInTheDocument();
});
it('grades a quiz, explains mistakes, retries and resets on lesson switch', async () => {
  setup();
  await screen.findByText(`${videos.length} videos`);
  fireEvent.click(screen.getByRole('button', { name: 'Practice (2)' }));
  expect(screen.getByRole('button', { name: 'Check my answers' })).toBeDisabled();
  const questions = screen.getAllByRole('group');
  fireEvent.click(within(questions[0]).getByLabelText('Small intestine'));
  fireEvent.click(within(questions[1]).getByLabelText('Stomach → oesophagus → small intestine'));
  fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
  expect(screen.getByText('Your score: 1/2 marks')).toBeInTheDocument();
  expect(screen.getByText(/Correct answer: Oesophagus/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Try again'));
  expect(screen.getByRole('button', { name: 'Check my answers' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Respiratory System/ }));
  expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-pressed', 'true');
});
it('shows failed rating honestly rather than a fake thank you', async () => {
  mocks.rate.mockRejectedValue(new Error('Sign in to rate.'));
  setup();
  await screen.findByText(`${videos.length} videos`);
  fireEvent.click(screen.getByLabelText('Rate 4 out of 5'));
  fireEvent.click(screen.getByText('Submit rating'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sign in to rate.');
  expect(mocks.rate).toHaveBeenCalledWith('4oXDoJkprx0', 4);
});
it('retries a failed library without claiming it is empty', async () => {
  mocks.list.mockRejectedValueOnce(new Error('Library offline')).mockResolvedValue(videos);
  setup();
  fireEvent.click(await screen.findByText('Retry library'));
  expect(await screen.findByText(`${videos.length} videos`)).toBeInTheDocument();
});
it('does not silently substitute another video for a broken shared link', async () => {
  setup('/learning-videos?video=missing');
  expect(await screen.findByText('This lesson is not available')).toBeInTheDocument();
});
it('filters the three collections, resets stale filters and selects a matching lesson', async () => {
  setup();
  await screen.findByText(`${videos.length} videos`);
  fireEvent.change(screen.getByLabelText('Filter by subject'), { target: { value: 'Science' } });
  fireEvent.change(screen.getByLabelText('Search videos'), { target: { value: 'digestion' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fun' }));
  expect(screen.getByText('4 videos')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /0:51 Family learning Tortoise/ })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Browse all videos in this collection/ })).toHaveAttribute(
    'href',
    '/learning-videos?category=fun&view=collection'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Lower Education' }));
  expect(screen.getByText('3 videos')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Common Greetings: CBC Learning Videos/ })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Upper Education' }));
  expect(screen.getByText('2 videos')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /The Journey of Human Digestion/ })
  ).toBeInTheDocument();
});
it('restores a category from its URL', async () => {
  setup('/learning-videos?category=fun');
  expect(await screen.findByText('4 videos')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Fun' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
it('opens the full collection on Soma, plays a lesson here and returns to the grid', async () => {
  const { container } = setup('/learning-videos?category=upper');
  await screen.findByText('2 videos');
  const collection = screen.getByRole('link', { name: 'View full collection on Soma' });
  expect(collection).not.toHaveAttribute('target');
  fireEvent.click(collection);
  expect(screen.getByRole('heading', { name: 'Upper Education collection' })).toBeInTheDocument();
  expect(container.querySelector('.video-collection-layout')).not.toBeNull();
  expect(container.querySelector('iframe')).toBeNull();
  expect(container.querySelector('a[href*="youtube.com/playlist"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /The Journey of Human Digestion/ }));
  expect(screen.getByTitle('The Journey of Human Digestion')).toHaveAttribute('src', expect.stringContaining('/embed/4oXDoJkprx0'));
  fireEvent.click(screen.getByRole('link', { name: /Back to collection/ }));
  expect(screen.getByRole('heading', { name: 'Upper Education collection' })).toBeInTheDocument();
  expect(container.querySelector('iframe')).toBeNull();
});
it('shows YouTube thumbnails and opens the matching player directly from a card', async () => {
  const { container } = setup('/learning-videos?category=fun');
  const card = await screen.findByRole('button', { name: /0:51 Family learning Tortoise/ });
  const thumbnail = card.querySelector('img')!;
  expect(thumbnail).toHaveAttribute('src', 'https://i.ytimg.com/vi/6XkLIFUNMdo/hqdefault.jpg');
  expect(container.querySelector('iframe')).toBeNull();
  fireEvent.click(card);
  const player = screen.getByTitle('Tortoise Colorful Journey');
  expect(player).toHaveAttribute('src', expect.stringContaining('/embed/6XkLIFUNMdo?autoplay=1&playsinline=1'));
  expect(player).toHaveAttribute('allow', expect.stringContaining('autoplay'));
  expect(screen.getByRole('link', { name: /watch this video on YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=6XkLIFUNMdo');
  fireEvent.error(thumbnail);
  expect(within(card).getByText('Somo Smart · Video')).toBeInTheDocument();
});
describe('video content validation', () => {
  it('accepts only canonical YouTube IDs and links', () => {
    expect(youtubeId('https://youtu.be/4oXDoJkprx0')).toBe('4oXDoJkprx0');
    expect(youtubeId('https://youtube.com/watch?v=4oXDoJkprx0')).toBe('4oXDoJkprx0');
    expect(youtubeId('https://evil.test/watch?v=4oXDoJkprx0')).toBe('');
    expect(youtubeId('javascript:alert(1)')).toBe('');
  });
  it('validates all seed lessons and rejects impossible quiz answers', () => {
    videos.forEach((v) => expect(() => validateStudy(v)).not.toThrow());
    expect(() =>
      validateStudy({ ...videos[0], quiz: [{ ...videos[0].quiz[0], answer: 99 }] })
    ).toThrow();
  });
});
it('requires editorial review before publishing and keeps drafts private', async () => {
  mocks.save.mockResolvedValue(undefined);
  const saved = vi.fn();
  render(<VideoHubEditor videos={videos} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText('Edit a lesson'), { target: { value: videos[0].id } });
  expect(screen.getByText('Publish reviewed lesson')).toBeDisabled();
  fireEvent.click(screen.getByText('Save private draft / unpublish'));
  expect(await screen.findByText('Private draft saved.')).toBeInTheDocument();
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({ id: videos[0].id, published: false })
  );
  fireEvent.click(screen.getByLabelText(/I checked the video/));
  fireEvent.click(screen.getByText('Publish reviewed lesson'));
  expect(await screen.findByText('Lesson published.')).toBeInTheDocument();
  expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({ published: true }));
  fireEvent.change(screen.getByLabelText(/Study notes/), { target: { value: 'Changed notes' } });
  expect(screen.getByText('Publish reviewed lesson')).toBeDisabled();
});

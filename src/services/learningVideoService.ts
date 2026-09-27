import { supabase } from '../lib/supabase';
import { VIDEO_CATEGORIES } from '../data/videoCategories';

export type VideoQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  marks: number;
};
export type VideoStudy = {
  notes: string;
  terms: { term: string; definition: string; example: string }[];
  quiz: VideoQuestion[];
};
export type LearningVideo = VideoStudy & {
  id: string;
  title: string;
  subject: string;
  level: string;
  category: string;
  duration: string;
  description: string;
  transcript: string;
  published: boolean;
  source_note: string;
};
export function youtubeId(input: string): string {
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return '';
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : ['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)
          ? url.searchParams.get('v') ||
            url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})$/)?.[1] ||
            ''
          : '';
    return /^[\w-]{11}$/.test(id) ? id : '';
  } catch {
    return '';
  }
}
export function validateStudy(value: unknown): VideoStudy {
  const v = value as VideoStudy;
  if (
    !v ||
    typeof v.notes !== 'string' ||
    v.notes.length > 60000 ||
    !Array.isArray(v.terms) ||
    v.terms.length > 40 ||
    !v.terms.every(
      (t) =>
        typeof t.term === 'string' &&
        typeof t.definition === 'string' &&
        typeof t.example === 'string'
    ) ||
    !Array.isArray(v.quiz) ||
    v.quiz.length > 20 ||
    !v.quiz.every(
      (q) =>
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.length <= 6 &&
        q.options.every((o) => typeof o === 'string') &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < q.options.length &&
        typeof q.explanation === 'string' &&
        Number.isInteger(q.marks) &&
        q.marks >= 1 &&
        q.marks <= 10
    )
  )
    throw new Error(
      'Study material has an invalid structure. Check the notes, terms and quiz answers.'
    );
  return { notes: v.notes, terms: v.terms, quiz: v.quiz };
}
export const videoLessonUrl = (id: string) =>
  `${window.location.origin}/learning-videos?video=${encodeURIComponent(id)}`;
export const learningVideoService = {
  async sync() {
    const { data, error } = await supabase.functions.invoke('sync-learning-videos', { body: {} });
    if (error) {
      let detail = '';
      try {
        detail = (await error.context?.json())?.error || '';
      } catch {
        /* Generic fallback below. */
      }
      throw new Error(
        detail || 'Video sync is unavailable. Check administrator sign-in and server setup.'
      );
    }
    return data as { inserted: number; refreshed: number; completedAt: string };
  },
  async list(admin = false): Promise<LearningVideo[]> {
    let query = supabase
      .from('learning_videos')
      .select('*')
      .order('created_at', { ascending: true });
    if (!admin) query = query.eq('published', true);
    const { data, error } = await query;
    if (error) throw new Error('The video library could not load. Please retry.');
    return data || [];
  },
  async isAdmin() {
    const { data, error } = await supabase.rpc('is_soma_admin');
    return !error && data === true;
  },
  async save(video: LearningVideo) {
    if (!VIDEO_CATEGORIES.some((c) => c.id === video.category))
      throw new Error('Choose Fun, Lower Education or Upper Education.');
    if (!youtubeId(video.id) || !video.title.trim() || !video.subject.trim() || !video.level.trim())
      throw new Error('Enter a valid YouTube link, title, subject and level.');
    validateStudy(video);
    const { error } = await supabase.from('learning_videos').upsert(video);
    if (error)
      throw new Error('Could not save. Please check your administrator sign-in and try again.');
  },
  async rating(id: string): Promise<{ average: number | null; count: number }> {
    const { data, error } = await supabase.rpc('learning_video_rating_summary', { p_video: id });
    if (error) throw new Error('Ratings are temporarily unavailable.');
    return data;
  },
  async rate(id: string, stars: number) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      throw new Error(
        'Sign in with an email account to submit a rating. Your rating is not saved yet.'
      );
    const { error } = await supabase.rpc('rate_learning_video', { p_video: id, p_stars: stars });
    if (error)
      throw new Error(
        'Your rating could not be saved. Check your connection and sign-in, then retry.'
      );
  },
};

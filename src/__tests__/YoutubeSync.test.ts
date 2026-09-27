import { describe, it, expect, vi } from 'vitest';
import {
  collectVideos,
  durationLabel,
  metadataUpdate,
  newVideo,
} from '../../supabase/functions/_shared/youtubeSync';
const video = {
  id: '6XkLIFUNMdo',
  title: 'Story',
  description: 'Description',
  duration: '0:51',
  category: 'fun',
  level: 'Family learning',
};
describe('playlist sync', () => {
  it('formats durations without inventing a value', () => {
    expect(durationLabel('PT1H2M3S')).toBe('1:02:03');
    expect(durationLabel('PT51S')).toBe('0:51');
    expect(durationLabel('bad')).toBe('');
  });
  it('imports empty resources and preserves all editorial fields on refresh', () => {
    expect(newVideo(video)).toMatchObject({
      published: true,
      notes: '',
      transcript: '',
      terms: [],
      quiz: [],
    });
    expect(Object.keys(metadataUpdate(video)).sort()).toEqual(['description', 'duration', 'title']);
  });
  it('paginates, deduplicates and excludes private or non-embeddable videos', async () => {
    const fetcher = vi.fn(async (input: URL) => {
      if (input.pathname.endsWith('/playlistItems'))
        return Response.json({
          items: [
            { contentDetails: { videoId: video.id } },
            { contentDetails: { videoId: '7Cp59eBytDY' } },
          ],
          ...(!input.searchParams.has('pageToken') ? { nextPageToken: 'next' } : {}),
        });
      return Response.json({
        items: [
          {
            id: video.id,
            snippet: { title: 'Story' },
            status: { privacyStatus: 'public', embeddable: true },
            contentDetails: { duration: 'PT51S' },
          },
          {
            id: '7Cp59eBytDY',
            snippet: { title: 'Private' },
            status: { privacyStatus: 'private', embeddable: true },
          },
        ],
      });
    });
    expect(await collectVideos('test', fetcher as unknown as typeof fetch)).toEqual([
      expect.objectContaining({ id: video.id, category: 'fun', duration: '0:51' }),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(9);
  });
  it('fails instead of treating API errors as an empty playlist', async () => {
    await expect(
      collectVideos('test', vi.fn(async () => new Response('', { status: 403 })) as typeof fetch)
    ).rejects.toThrow('403');
  });
  it('stops repeated pagination tokens', async () => {
    await expect(
      collectVideos(
        'test',
        vi.fn(async () => Response.json({ items: [], nextPageToken: 'same' })) as typeof fetch
      )
    ).rejects.toThrow('pagination');
  });
});

// Fixed, curated playlists only; callers cannot supply arbitrary remote URLs.
export const playlists = [
  { id: 'PLhhKTZSYPAy2HgTpwvb6RC8R91rIIdY2e', category: 'fun', level: 'Family learning' },
  { id: 'PLhhKTZSYPAy3R0bsnNjkXQ2rka9JqxaN6', category: 'lower', level: 'Early years' },
  { id: 'PLIjFyZ2La_D0', category: 'upper', level: 'Foundation learning' },
];
export type ImportedVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  level: string;
};
export function durationLabel(value: string) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!m) return '';
  const hours = Number(m[1] || 0),
    minutes = Number(m[2] || 0),
    seconds = Number(m[3] || 0);
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
export async function collectVideos(
  key: string,
  fetcher: typeof fetch = fetch
): Promise<ImportedVideo[]> {
  async function request(path: string, params: Record<string, string>) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    url.search = new URLSearchParams({ ...params, key }).toString();
    const response = await fetcher(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok)
      throw new Error(`YouTube API returned ${response.status}. Check API access and quota.`);
    const result = await response.json();
    if (!Array.isArray(result.items)) throw new Error('YouTube returned an invalid response.');
    return result;
  }
  const result = new Map<string, ImportedVideo>();
  for (const playlist of playlists) {
    let token = '';
    const tokens = new Set<string>();
    const ids = new Set<string>();
    do {
      if (tokens.has(token) || tokens.size >= 20)
        throw new Error('Playlist pagination limit reached; no changes saved.');
      tokens.add(token);
      const page = await request('playlistItems', {
        part: 'contentDetails',
        playlistId: playlist.id,
        maxResults: '50',
        ...(token ? { pageToken: token } : {}),
      });
      for (const item of page.items) {
        const id = item.contentDetails?.videoId;
        if (typeof id === 'string' && /^[\w-]{11}$/.test(id)) ids.add(id);
      }
      token = page.nextPageToken || '';
    } while (token);
    const allIds = [...ids];
    for (let start = 0; start < allIds.length; start += 50) {
      const page = await request('videos', {
        part: 'snippet,contentDetails,status',
        id: allIds.slice(start, start + 50).join(','),
      });
      for (const video of page.items) {
        if (
          !ids.has(video.id) ||
          result.has(video.id) ||
          video.status?.privacyStatus !== 'public' ||
          video.status?.embeddable !== true ||
          !video.snippet?.title
        )
          continue;
        result.set(video.id, {
          id: video.id,
          title: String(video.snippet.title).slice(0, 200),
          description: String(video.snippet.description || '').slice(0, 5000),
          duration: durationLabel(video.contentDetails?.duration || ''),
          category: playlist.category,
          level: playlist.level,
        });
      }
    }
  }
  return [...result.values()];
}

export function newVideo(video: ImportedVideo) {
  return {
    ...video,
    subject: video.category === 'fun' ? 'Storytelling' : 'General learning',
    published: true,
    notes: '',
    transcript: '',
    terms: [],
    quiz: [],
    source_note:
      'Imported from a curated Somo Smart YouTube playlist. Study notes, terms, transcript and quiz await editorial review.',
  };
}

// Refresh source metadata only. Never overwrite editorial content, category or publication decisions.
export function metadataUpdate(video: ImportedVideo) {
  return { title: video.title, description: video.description, duration: video.duration };
}

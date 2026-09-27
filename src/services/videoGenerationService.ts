import { supabase } from '../lib/supabase';
export type VideoGeneration = {
  id: string;
  video_id: string;
  kind: 'study' | 'transcript';
  input: { title?: string; level?: string };
  result: string | null;
  status: string;
  created_at: string;
};
export async function savedVideoGeneration(
  videoId: string,
  kind: 'study' | 'transcript',
  input: Record<string, unknown>,
  model: string,
  generate: () => Promise<{ text: string; usage: unknown }>
): Promise<string> {
  if (!/^[\w-]{11}$/.test(videoId))
    throw new Error('Enter the YouTube video link before generating.');
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('learning_video_generations')
    .insert({ id, video_id: videoId, kind, input, model });
  if (error)
    throw new Error(
      'Could not create a private generation record. Check your admin sign-in. No AI request was sent.'
    );
  let result;
  try {
    result = await generate();
  } catch (e) {
    await supabase.from('learning_video_generations').update({ status: 'failed' }).eq('id', id);
    throw e;
  }
  const payload = { result: result.text, usage: result.usage, status: 'complete' };
  let saved = await supabase.from('learning_video_generations').update(payload).eq('id', id);
  if (saved.error)
    saved = await supabase.from('learning_video_generations').update(payload).eq('id', id);
  if (saved.error) {
    // Keep the paid output available for explicit recovery rather than silently discarding it.
    throw Object.assign(
      new Error(
        'AI finished but the private save failed. Copy the recovered result below before leaving, then save the lesson manually.'
      ),
      { generatedText: result.text, generationKind: kind }
    );
  }
  return result.text;
}
export async function listVideoGenerations(): Promise<VideoGeneration[]> {
  const { data, error } = await supabase
    .from('learning_video_generations')
    .select('id,video_id,kind,input,result,status,created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error('Could not load generation history.');
  return data || [];
}
export async function getVideoGeneration(id: string): Promise<VideoGeneration> {
  const { data, error } = await supabase
    .from('learning_video_generations')
    .select('id,video_id,kind,input,result,status,created_at')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error('This private generation is unavailable to this account.');
  return data;
}

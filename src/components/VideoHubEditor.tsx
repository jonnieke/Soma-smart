import React, { useEffect, useState } from 'react';
import { VIDEO_CATEGORIES } from '../data/videoCategories';
import {
  VideoGeneration,
  getVideoGeneration,
  listVideoGenerations,
} from '../services/videoGenerationService';
import { parseModelJson } from '../services/jsonResponse';
import {
  LearningVideo,
  VideoStudy,
  learningVideoService,
  validateStudy,
  youtubeId,
} from '../services/learningVideoService';

const empty: LearningVideo = {
  id: '',
  title: '',
  subject: '',
  level: '',
  category: '',
  duration: '',
  description: '',
  notes: '',
  terms: [],
  quiz: [],
  transcript: '',
  published: false,
  source_note: '',
};
export default function VideoHubEditor({
  videos,
  onSaved,
  generationId,
}: {
  videos: LearningVideo[];
  onSaved: () => void;
  generationId?: string | null;
}) {
  const [draft, setDraft] = useState<LearningVideo>(empty);
  const [study, setStudy] = useState<VideoStudy>({ notes: '', terms: [], quiz: [] });
  const [rights, setRights] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<VideoGeneration[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [recoveredText, setRecoveredText] = useState('');
  function restore(g: VideoGeneration) {
    if (!g.result || g.status !== 'complete') {
      setMessage('This generation did not complete. You can start a new request.');
      return;
    }
    try {
      const previous = videos.find((v) => v.id === g.video_id) || {
        ...empty,
        id: g.video_id,
        title: g.input.title || '',
        level: g.input.level || '',
      };
      if (g.kind === 'study') {
        setStudy(validateStudy(parseModelJson(g.result)));
        setDraft(previous);
      } else {
        const parsed = parseModelJson<{ transcript: string; complete: boolean }>(g.result);
        if (!parsed.complete)
          throw new Error(
            'This transcript is incomplete. Recover the saved output below and transcribe a shorter clip.'
          );
        setDraft({ ...previous, transcript: parsed.transcript });
        setStudy({ notes: previous.notes, terms: previous.terms, quiz: previous.quiz });
      }
      setReviewed(false);
      setRights(false);
      setMessage('Saved generation restored for review. It is not published automatically.');
    } catch (e) {
      setRecoveredText(g.result);
      setMessage(e instanceof Error ? e.message : 'Review the saved result below.');
    }
  }
  useEffect(() => {
    let active = true;
    listVideoGenerations()
      .then((rows) => {
        if (active) setHistory(rows);
      })
      .catch(() => {
        if (active) setHistoryError('Generation history is unavailable.');
      });
    if (generationId)
      getVideoGeneration(generationId)
        .then((g) => {
          if (active) restore(g);
        })
        .catch((e) => {
          if (active) setHistoryError(e.message);
        });
    return () => {
      active = false;
    };
  }, [generationId]);
  const field = (key: keyof LearningVideo, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setReviewed(false);
  };
  const choose = (id: string) => {
    const v = videos.find((v) => v.id === id) || empty;
    setDraft(v);
    setStudy({ notes: v.notes, terms: v.terms, quiz: v.quiz });
    setReviewed(false);
    setRights(false);
    setMessage('');
  };
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (e) {
      if (e && typeof e === 'object' && 'generatedText' in e)
        setRecoveredText(String(e.generatedText));
      setMessage(
        e instanceof Error ? e.message : 'Could not complete this action. Your draft is still here.'
      );
    } finally {
      setBusy(false);
      listVideoGenerations()
        .then(setHistory)
        .catch(() => setHistoryError('Generation history is unavailable.'));
    }
  }
  async function transcribe(file: File) {
    if (!rights) throw new Error('Confirm you have permission to transcribe this source first.');
    if (file.size > 4 * 1024 * 1024)
      throw new Error('Use a clip smaller than 4 MB. Split longer recordings.');
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const { transcribeVideoAudio } = await import('../services/geminiService');
    const transcript = await transcribeVideoAudio(base64, file.type, draft.id);
    field('transcript', transcript);
    setMessage('Transcript draft ready. Check it against the recording before publishing.');
  }
  return (
    <section className="video-panel video-editor" aria-label="Manage learning videos">
      <h2>Video publishing desk</h2>
      <p>
        Add a YouTube video, prepare its lesson, then review and publish. AI actions use the
        existing account allowance. Generated study materials require review before publishing.
      </p>
      <fieldset disabled={busy}>
        <div className="video-notice">
          <strong>Somo Smart playlist sync</strong>
          <p>
            Import public, embeddable videos from the three curated playlists. New videos become
            watchable; study materials stay empty until reviewed. Existing drafts stay private.
            YouTube titles and descriptions refresh; notes and quizzes are preserved.
          </p>
          <button
            type="button"
            onClick={() =>
              void run(async () => {
                const result = await learningVideoService.sync();
                setMessage(
                  `Sync complete: ${result.inserted} new videos, ${result.refreshed} metadata updates.`
                );
                onSaved();
              })
            }
          >
            Sync YouTube playlists now
          </button>
        </div>
        <details>
          <summary>Recover a saved generation ({history.length})</summary>
          <p>{historyError || 'Only your administrator account can see these saved AI results.'}</p>
          {history.map((g) => (
            <div className="video-actions" key={g.id}>
              <button type="button" onClick={() => restore(g)}>
                {g.kind} · {g.video_id} · {new Date(g.created_at).toLocaleString()} · {g.status}
              </button>
              <a href={`/learning-videos?generation=${g.id}`}>Private link</a>
            </div>
          ))}
        </details>
        {recoveredText && (
          <label>
            Recoverable AI result — copy before leaving
            <textarea readOnly rows={10} value={recoveredText} />
          </label>
        )}
        <label>
          Edit a lesson
          <select value={draft.id} onChange={(e) => choose(e.target.value)}>
            <option value="">New lesson</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
                {v.published ? '' : ' (draft)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          YouTube video link or ID
          <input
            value={draft.id}
            onChange={(e) => field('id', youtubeId(e.target.value) || e.target.value)}
          />
        </label>
        <div className="video-fields">
          <label>
            Category
            <select
              value={draft.category || ''}
              onChange={(e) => field('category', e.target.value)}
            >
              <option value="">Choose a category</option>
              {VIDEO_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {(['title', 'subject', 'level', 'duration'] as const).map((key) => (
            <label key={key}>
              {key}
              <input value={draft[key]} onChange={(e) => field(key, e.target.value)} />
            </label>
          ))}
        </div>
        <label>
          Short description
          <textarea
            value={draft.description}
            onChange={(e) => field('description', e.target.value)}
          />
        </label>
        <label className="video-check">
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} /> I
          own this audio/transcript or have permission to transcribe and publish it.
        </label>
        <label>
          Transcribe a source audio clip (up to 4 MB)
          <input
            type="file"
            accept="audio/*"
            disabled={!rights}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void run(() => transcribe(file));
              e.target.value = '';
            }}
          />
        </label>
        <p>
          YouTube links alone cannot supply an authorised transcript. Paste your transcript below or
          upload your original audio. Transcription replaces the current transcript.
        </p>
        <label>
          Transcript
          <textarea
            rows={9}
            maxLength={30000}
            value={draft.transcript}
            onChange={(e) => field('transcript', e.target.value)}
          />
        </label>
        <button
          type="button"
          className="video-primary"
          disabled={!rights || draft.transcript.trim().length < 80}
          onClick={() =>
            void run(async () => {
              const { prepareVideoStudy } = await import('../services/geminiService');
              const { parseModelJson } = await import('../services/jsonResponse');
              const result = validateStudy(
                parseModelJson(
                  await prepareVideoStudy(draft.transcript, draft.title, draft.level, draft.id)
                )
              );
              setStudy(result);
              setReviewed(false);
              setMessage(
                'Study pack generated. Review every definition and quiz answer before publishing.'
              );
            })
          }
        >
          Generate notes, terms & quiz
        </button>
        <label>
          Study notes (headings and bullet points supported)
          <textarea
            rows={12}
            value={study.notes}
            onChange={(e) => {
              setStudy((s) => ({ ...s, notes: e.target.value }));
              setReviewed(false);
            }}
          />
        </label>
        <details>
          <summary>Key terms ({study.terms.length})</summary>
          {study.terms.map((term, i) => (
            <div className="video-question" key={i}>
              {(['term', 'definition', 'example'] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={term[key]}
                    onChange={(e) => {
                      setStudy((s) => ({
                        ...s,
                        terms: s.terms.map((t, j) =>
                          j === i ? { ...t, [key]: e.target.value } : t
                        ),
                      }));
                      setReviewed(false);
                    }}
                  />
                </label>
              ))}
              <button
                onClick={() => {
                  setStudy((s) => ({ ...s, terms: s.terms.filter((_, j) => j !== i) }));
                  setReviewed(false);
                }}
              >
                Remove term
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setStudy((s) => ({
                ...s,
                terms: [...s.terms, { term: '', definition: '', example: '' }],
              }));
              setReviewed(false);
            }}
          >
            Add term
          </button>
        </details>
        <details>
          <summary>Practice questions ({study.quiz.length})</summary>
          {study.quiz.map((q, i) => (
            <div className="video-question" key={i}>
              <label>
                Question {i + 1}
                <input
                  value={q.question}
                  onChange={(e) => {
                    setStudy((s) => ({
                      ...s,
                      quiz: s.quiz.map((v, j) =>
                        j === i ? { ...v, question: e.target.value } : v
                      ),
                    }));
                    setReviewed(false);
                  }}
                />
              </label>
              {q.options.map((option, k) => (
                <label key={k}>
                  Option {k + 1}
                  <input
                    value={option}
                    onChange={(e) => {
                      setStudy((s) => ({
                        ...s,
                        quiz: s.quiz.map((v, j) =>
                          j === i
                            ? {
                                ...v,
                                options: v.options.map((o, n) => (n === k ? e.target.value : o)),
                              }
                            : v
                        ),
                      }));
                      setReviewed(false);
                    }}
                  />
                </label>
              ))}
              <label>
                Correct answer
                <select
                  value={q.answer}
                  onChange={(e) => {
                    setStudy((s) => ({
                      ...s,
                      quiz: s.quiz.map((v, j) =>
                        j === i ? { ...v, answer: Number(e.target.value) } : v
                      ),
                    }));
                    setReviewed(false);
                  }}
                >
                  {q.options.map((option, k) => (
                    <option key={k} value={k}>
                      Option {k + 1}: {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Explanation
                <textarea
                  value={q.explanation}
                  onChange={(e) => {
                    setStudy((s) => ({
                      ...s,
                      quiz: s.quiz.map((v, j) =>
                        j === i ? { ...v, explanation: e.target.value } : v
                      ),
                    }));
                    setReviewed(false);
                  }}
                />
              </label>
              <label>
                Marks
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={q.marks}
                  onChange={(e) => {
                    setStudy((s) => ({
                      ...s,
                      quiz: s.quiz.map((v, j) =>
                        j === i ? { ...v, marks: Number(e.target.value) } : v
                      ),
                    }));
                    setReviewed(false);
                  }}
                />
              </label>
              <button
                onClick={() => {
                  setStudy((s) => ({ ...s, quiz: s.quiz.filter((_, j) => j !== i) }));
                  setReviewed(false);
                }}
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setStudy((s) => ({
                ...s,
                quiz: [
                  ...s.quiz,
                  { question: '', options: ['', '', ''], answer: 0, explanation: '', marks: 1 },
                ],
              }));
              setReviewed(false);
            }}
          >
            Add question
          </button>
        </details>
        <label>
          Content provenance / sources
          <textarea
            value={draft.source_note}
            onChange={(e) => field('source_note', e.target.value)}
            placeholder="Who prepared the notes? Are they based on the transcript or supplementary?"
          />
        </label>
        <label className="video-check">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />{' '}
          I checked the video, notes, terminology, transcript permissions and every quiz answer.
        </label>
        <div className="video-actions">
          <button
            type="button"
            onClick={() =>
              void run(async () => {
                await learningVideoService.save({
                  ...draft,
                  ...validateStudy(study),
                  published: false,
                });
                setMessage('Private draft saved.');
                onSaved();
              })
            }
          >
            Save private draft / unpublish
          </button>
          <button
            type="button"
            className="video-primary"
            disabled={!reviewed || (!!draft.transcript && !rights)}
            onClick={() =>
              void run(async () => {
                if (!draft.source_note.trim())
                  throw new Error('Add the content provenance before publishing.');
                await learningVideoService.save({
                  ...draft,
                  ...validateStudy(study),
                  published: true,
                });
                setMessage('Lesson published.');
                onSaved();
              })
            }
          >
            Publish reviewed lesson
          </button>
        </div>
      </fieldset>
      <p role="status">{busy ? 'Working… keep this page open.' : message}</p>
    </section>
  );
}

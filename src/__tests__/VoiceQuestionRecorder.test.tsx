import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceQuestionRecorder } from '../features/learner/voice/VoiceQuestionRecorder';

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] };
const getUserMedia = vi.fn();
class Recorder {
  static isTypeSupported = () => true;
  state = 'inactive';
  mimeType = 'audio/mp4';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror = null;
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['question'], { type: this.mimeType }) }); this.onstop?.(); }
}
const props = () => ({ onClose: vi.fn(), onSubmit: vi.fn(), onTranscribe: vi.fn(async (_audio: Blob) => 'What is photosynthesis?') });
beforeEach(() => {
  vi.clearAllMocks();
  getUserMedia.mockResolvedValue(stream);
  vi.stubGlobal('MediaRecorder', Recorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:voice-test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function record() {
  fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Stop recording' }));
}
describe('Voice question review', () => {
  it('records locally, reviews editable transcription, and submits only on confirmation', async () => {
    const callbacks = props(); render(<VoiceQuestionRecorder {...callbacks} />);
    expect(getUserMedia).not.toHaveBeenCalled();
    await record(); expect(stopTrack).toHaveBeenCalled(); expect(callbacks.onTranscribe).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Transcribe recording' }));
    await screen.findByDisplayValue('What is photosynthesis?');
    expect(callbacks.onTranscribe.mock.calls[0][0].type).toBe('audio/mp4');
    expect(callbacks.onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Explain photosynthesis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Akili' }));
    expect(callbacks.onSubmit).toHaveBeenCalledWith('Explain photosynthesis');
  });
  it('keeps the audio after transcription fails and retries the same recording', async () => {
    const callbacks = props(); callbacks.onTranscribe.mockRejectedValueOnce(new Error('Connection lost'));
    render(<VoiceQuestionRecorder {...callbacks} />); await record();
    fireEvent.click(screen.getByRole('button', { name: 'Transcribe recording' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Your recorded question')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry transcription' }));
    await screen.findByDisplayValue('What is photosynthesis?');
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(callbacks.onTranscribe.mock.calls[0][0]).toBe(callbacks.onTranscribe.mock.calls[1][0]);
  });
  it('offers typing when microphone permission is denied', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    const callbacks = props(); render(<VoiceQuestionRecorder {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Microphone access is blocked');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Help with fractions' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Akili' }));
    expect(callbacks.onSubmit).toHaveBeenCalledWith('Help with fractions');
  });
  it('releases a stream that arrives after closing', async () => {
    let resolve!: (value: unknown) => void;
    getUserMedia.mockReturnValue(new Promise(done => { resolve = done; }));
    const { unmount } = render(<VoiceQuestionRecorder {...props()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' })); unmount();
    await act(async () => resolve(stream)); expect(stopTrack).toHaveBeenCalled();
  });
  it('stops the microphone on unmount without transcribing', async () => {
    const callbacks = props(); const { unmount } = render(<VoiceQuestionRecorder {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    await screen.findByRole('button', { name: 'Stop recording' }); unmount();
    expect(stopTrack).toHaveBeenCalled(); expect(callbacks.onTranscribe).not.toHaveBeenCalled();
  });
  it('does not submit late transcription after the dialog closes', async () => {
    let resolve!: (value: string) => void;
    const callbacks = props(); callbacks.onTranscribe.mockReturnValue(new Promise(done => { resolve = done; }));
    const { unmount } = render(<VoiceQuestionRecorder {...callbacks} />); await record();
    fireEvent.click(screen.getByRole('button', { name: 'Transcribe recording' })); unmount();
    await act(async () => resolve('Late question')); expect(callbacks.onSubmit).not.toHaveBeenCalled();
  });
});

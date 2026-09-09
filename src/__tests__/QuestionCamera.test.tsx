import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionCamera } from '../features/learner/camera/QuestionCamera';
import { prepareQuestionPhoto } from '../features/learner/camera/cameraCapture';

vi.mock('../features/learner/camera/cameraCapture', async importOriginal => ({
  ...await importOriginal<typeof import('../features/learner/camera/cameraCapture')>(),
  prepareQuestionPhoto: vi.fn(async () => new Blob(['edited'], { type: 'image/jpeg' })),
}));
const stop = vi.fn();
const applyConstraints = vi.fn(async () => undefined);
const track = { stop, getCapabilities: () => ({}), getSettings: () => ({}), applyConstraints, onended: null };
const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
const media = vi.fn();
const props = () => ({ onClose: vi.fn(), onUsePhoto: vi.fn(), onAudio: vi.fn() });
beforeEach(() => {
  vi.clearAllMocks();
  media.mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: media } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:camera-test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['photo'], { type: 'image/jpeg' })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const readyCamera = async (container: HTMLElement) => {
  await waitFor(() => expect(media).toHaveBeenCalled());
  const video = container.querySelector('video')!;
  Object.defineProperties(video, { videoWidth: { value: 2560, configurable: true }, videoHeight: { value: 1920, configurable: true }, readyState: { value: 2, configurable: true } });
  fireEvent.loadedData(video);
};

describe('Question camera review flow', () => {
  it('does not allow capture until video is ready', () => {
    render(<QuestionCamera {...props()} />);
    expect(screen.getByRole('button', { name: 'Capture' })).toBeDisabled();
  });
  it('captures for review, stops the camera, and sends only after confirmation', async () => {
    const callbacks = props(); const { container } = render(<QuestionCamera {...callbacks} />);
    await readyCamera(container);
    fireEvent.click(screen.getByRole('button', { name: 'Capture' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    expect(stop).toHaveBeenCalled();
    expect(callbacks.onUsePhoto).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(callbacks.onUsePhoto).toHaveBeenCalledOnce());
    expect(callbacks.onUsePhoto.mock.calls[0][0]).toBeInstanceOf(File);
  });
  it('retakes without sending the discarded capture', async () => {
    const callbacks = props(); const { container } = render(<QuestionCamera {...callbacks} />);
    await readyCamera(container); fireEvent.click(screen.getByRole('button', { name: 'Capture' }));
    await screen.findByRole('button', { name: 'Retake' });
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));
    await waitFor(() => expect(media).toHaveBeenCalledTimes(2));
    expect(callbacks.onUsePhoto).not.toHaveBeenCalled();
  });
  it('applies rotation and crop only when the reviewed photo is confirmed', async () => {
    const callbacks = props(); render(<QuestionCamera {...callbacks} />);
    const file = new File(['image'], 'question.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose question photo'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use photo' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Crop' }));
    fireEvent.change(screen.getByLabelText('left crop edge'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(prepareQuestionPhoto).toHaveBeenLastCalledWith(file, 1, { left: 20, top: 0, right: 100, bottom: 100 }));
  });
  it('shows actionable fallback controls after permission denial', async () => {
    media.mockRejectedValue({ name: 'NotAllowedError' }); render(<QuestionCamera {...props()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Camera permission is blocked');
    expect(screen.getByRole('button', { name: 'Gallery' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Use phone camera instead' })).toBeEnabled();
    expect(screen.queryByRole('slider', { name: 'Camera zoom' })).toBeNull();
  });
  it('stops a stream that resolves after the camera closes', async () => {
    let resolve!: (value: unknown) => void;
    media.mockReturnValue(new Promise(done => { resolve = done; }));
    const { unmount } = render(<QuestionCamera {...props()} />);
    unmount();
    await act(async () => { resolve(stream); });
    expect(stop).toHaveBeenCalled();
  });
  it('supports escape and stops active tracks on unmount', async () => {
    const callbacks = props(); const { unmount, container } = render(<QuestionCamera {...callbacks} />);
    await readyCamera(container);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(callbacks.onClose).toHaveBeenCalledOnce();
    unmount(); expect(stop).toHaveBeenCalled();
  });
  it('shows and applies hardware controls only when the track supports them', async () => {
    const settings = { zoom: 1, torch: false };
    const supportedTrack = { ...track, getCapabilities: () => ({ zoom: { min: 1, max: 3, step: 0.1 }, torch: true }), getSettings: () => settings, applyConstraints: vi.fn(async (constraints: MediaTrackConstraints) => { Object.assign(settings, constraints.advanced?.[0]); }) };
    media.mockResolvedValue({ getTracks: () => [supportedTrack], getVideoTracks: () => [supportedTrack] });
    const { container } = render(<QuestionCamera {...props()} />);
    await readyCamera(container);
    fireEvent.click(screen.getByRole('button', { name: 'Light off' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Light on' })).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.change(screen.getByLabelText('Camera zoom'), { target: { value: '2' } });
    await waitFor(() => expect(supportedTrack.applyConstraints).toHaveBeenLastCalledWith({ advanced: [{ zoom: 2 }] }));
  });
  it('rejects non-image imports without sending them', async () => {
    const callbacks = props(); render(<QuestionCamera {...callbacks} />);
    fireEvent.change(screen.getByLabelText('Choose question photo'), { target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an image');
    expect(callbacks.onUsePhoto).not.toHaveBeenCalled();
  });
});

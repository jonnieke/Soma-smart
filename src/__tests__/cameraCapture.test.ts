import { describe, expect, it, vi } from 'vitest';
import { cameraErrorMessage, cropPixels, FULL_CROP, requestQuestionCamera } from '../features/learner/camera/cameraCapture';

describe('Question camera capture', () => {
  it('requests high resolution without requiring unsupported hardware', async () => {
    const getUserMedia = vi.fn().mockResolvedValue({});
    await requestQuestionCamera({ getUserMedia });
    expect(getUserMedia).toHaveBeenCalledWith({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1920 } } });
  });
  it('falls back to rear-camera defaults only for unsupported constraints', async () => {
    const getUserMedia = vi.fn().mockRejectedValueOnce({ name: 'OverconstrainedError' }).mockResolvedValueOnce({});
    await requestQuestionCamera({ getUserMedia });
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(getUserMedia).toHaveBeenLastCalledWith({ audio: false, video: { facingMode: 'environment' } });
  });
  it('does not repeat permission requests after denial', async () => {
    const error = { name: 'NotAllowedError' };
    const getUserMedia = vi.fn().mockRejectedValue(error);
    await expect(requestQuestionCamera({ getUserMedia })).rejects.toEqual(error);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });
  it('preserves full-frame dimensions when no crop is selected', () => {
    expect(cropPixels(2560, 1920, FULL_CROP)).toEqual({ x: 0, y: 0, width: 2560, height: 1920 });
  });
  it('maps review crop percentages to exact image pixels', () => {
    expect(cropPixels(2000, 1000, { left: 10, top: 20, right: 80, bottom: 90 })).toEqual({ x: 200, y: 200, width: 1400, height: 700 });
  });
  it('explains permission, missing-device and busy-device errors', () => {
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toMatch(/permission is blocked/);
    expect(cameraErrorMessage({ name: 'NotFoundError' })).toMatch(/No camera/);
    expect(cameraErrorMessage({ name: 'NotReadableError' })).toMatch(/camera is busy/);
  });
});

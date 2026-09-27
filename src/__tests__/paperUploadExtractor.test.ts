import { describe, it, expect, vi } from 'vitest';
import { paperUploadExtractor } from '../services/assessmentEngine/paperUploadExtractor';

describe('Paper import is unavailable until genuine extraction is implemented', () => {
  it.each(['application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])(
    'fails honestly for %s without reporting extraction success', async type => {
      const progress = vi.fn();
      await expect(paperUploadExtractor.extractPaperBlueprint(new File(['biology'], 'paper', { type }), progress)).rejects.toThrow('not available');
      expect(progress).toHaveBeenCalledWith(expect.objectContaining({ step: 'FAILED', percent: 0 }));
    },
  );
});

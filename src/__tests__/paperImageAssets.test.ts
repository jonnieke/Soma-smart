// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { allowedPaperImageSource, fitPaperImage, loadPaperImages } from '../services/paperImageAssets';
import { exportPaper } from './fixtures/exportPaper';
afterEach(() => { vi.unstubAllGlobals(); });
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=', 'base64'));
const paper = () => {
  const copy = structuredClone(exportPaper);
  copy.sections[0].questions[0].imageUrls = ['https://example.com/diagram.png', 'https://example.com/diagram.png'];
  return copy;
};
it('loads duplicate images once, strips credentials and preserves proportions', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(png));
  const close = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1200, height: 600, close }));
  const assets = await loadPaperImages(paper());
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('https://example.com/diagram.png', expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }));
  expect([...assets.values()][0]).toMatchObject({ width: 600, height: 300, type: 'png' });
  expect(close).toHaveBeenCalled();
});
it('rejects unreadable images and unsupported formats rather than skipping them', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('denied', { status: 403 })));
  await expect(loadPaperImages(paper())).rejects.toThrow('No Word file');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<svg/>')));
  await expect(loadPaperImages(paper())).rejects.toThrow('Only PNG and JPEG');
});
it('bounds image sizes and paper attachment counts', async () => {
  expect(fitPaperImage(100, 1000)).toEqual({ width: 65, height: 650 });
  expect(() => fitPaperImage(0, 2)).toThrow('dimensions');
  expect(() => fitPaperImage(6000, 6000)).toThrow('dimensions');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(png, { headers: { 'content-length': '99999999' } })));
  await expect(loadPaperImages(paper())).rejects.toThrow('8 MB');
  const many = paper(); many.sections[0].questions[0].imageUrls = Array.from({ length: 31 }, (_, i) => `https://example.com/${i}.png`);
  await expect(loadPaperImages(many)).rejects.toThrow('30 images');
});
it('rejects executable URLs and URLs with embedded credentials', () => {
  expect(allowedPaperImageSource('javascript:alert(1)')).toBe(false);
  expect(allowedPaperImageSource('https://user:secret@example.com/a.png')).toBe(false);
  expect(allowedPaperImageSource('data:image/svg+xml,<svg/>')).toBe(false);
  expect(allowedPaperImageSource('https://example.com/a.png')).toBe(true);
});

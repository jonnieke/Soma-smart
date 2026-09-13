import type { ExamPaper } from '../types/paperStudio';

export interface PaperImageAsset {
  data: Uint8Array;
  type: 'png' | 'jpg';
  width: number;
  height: number;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

export function paperImageSources(paper: ExamPaper): string[] {
  const sources = paper.sections.flatMap(section => section.questions.flatMap(q => q.imageUrls || []));
  if (paper.schoolBranding.logoUrl) sources.unshift(paper.schoolBranding.logoUrl);
  return [...new Set(sources)];
}

// The same URL policy is used by the on-screen preview and the browser-only exporter.
export function allowedPaperImageSource(source: string): boolean {
  if (/^data:image\/(png|jpeg);base64,/i.test(source)) return true;
  try {
    const url = new URL(source, typeof location === 'undefined' ? 'https://soma.invalid' : location.href);
    return !url.username && !url.password && (url.protocol === 'https:' ||
      (typeof location !== 'undefined' && url.origin === location.origin && ['http:', 'blob:'].includes(url.protocol)));
  } catch { return false; }
}

export function fitPaperImage(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width * height > 25_000_000) {
    throw new Error('Image dimensions are invalid or too large. Use an image under 25 megapixels.');
  }
  const scale = Math.min(1, 600 / width, 650 / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function loadImage(source: string, signal: AbortSignal): Promise<PaperImageAsset> {
  if (source.length > MAX_IMAGE_BYTES * 1.4) throw new Error('An image exceeds 8 MB. Use a smaller image.');
  if (!allowedPaperImageSource(source)) throw new Error('Unsupported image address. Use a PNG or JPEG attachment.');
  // Never forward the teacher's cookies, session token or current page URL to an image host.
  const response = await fetch(source, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok || !response.body) throw new Error('An image could not be loaded. Check its access and try again.');
  if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new Error('An image exceeds 8 MB. Use a smaller image.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMAGE_BYTES) throw new Error('An image exceeds 8 MB. Use a smaller image.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => data[i] === byte);
  const jpg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  if (!png && !jpg) throw new Error('Only PNG and JPEG images are supported in Word. Convert this attachment before exporting.');
  if (png && data.length >= 24) {
    const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
    fitPaperImage(header.getUint32(16), header.getUint32(20));
  }
  const bitmap = await createImageBitmap(new Blob([data], { type: png ? 'image/png' : 'image/jpeg' }));
  try {
    return { data, type: png ? 'png' : 'jpg', ...fitPaperImage(bitmap.width, bitmap.height) };
  } finally { bitmap.close(); }
}

export async function loadPaperImages(paper: ExamPaper): Promise<Map<string, PaperImageAsset>> {
  const sources = paperImageSources(paper);
  if (sources.length > 30) throw new Error('This paper has more than 30 images. Split it into smaller papers before exporting.');
  const assets = new Map<string, PaperImageAsset>();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let total = 0;
  try {
    // Load sequentially to bound decoded image memory on phones; duplicates are fetched once.
    for (const source of sources) {
      const asset = await loadImage(source, controller.signal);
      total += asset.data.byteLength;
      if (total > MAX_TOTAL_BYTES) throw new Error('The images exceed 24 MB in total. Use smaller attachments.');
      assets.set(source, asset);
    }
    return assets;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Image loading timed out. Your paper is unchanged; check your connection and retry.');
    throw new Error(`${error instanceof Error ? error.message : 'Image loading failed.'} No Word file was downloaded; your paper is unchanged.`);
  } finally { clearTimeout(timer); }
}

export type Crop = { left: number; top: number; right: number; bottom: number };
export const FULL_CROP: Crop = { left: 0, top: 0, right: 100, bottom: 100 };

export async function requestQuestionCamera(media: Pick<MediaDevices, 'getUserMedia'>): Promise<MediaStream> {
  try {
    return await media.getUserMedia({ audio: false, video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 2560 }, height: { ideal: 1920 },
    } });
  } catch (error) {
    // Never repeat a permission prompt after denial. Retry only unsupported constraints.
    if ((error as DOMException).name !== 'OverconstrainedError') throw error;
    return media.getUserMedia({ audio: false, video: { facingMode: 'environment' } });
  }
}

export function cropPixels(width: number, height: number, crop: Crop) {
  const x = Math.floor(width * crop.left / 100);
  const y = Math.floor(height * crop.top / 100);
  return { x, y, width: Math.max(1, Math.min(width - x, Math.round(width * (crop.right - crop.left) / 100))), height: Math.max(1, Math.min(height - y, Math.round(height * (crop.bottom - crop.top) / 100))) };
}

export const canvasBlob = (canvas: HTMLCanvasElement, quality = 0.96) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not save this photo. Please retake it.')), 'image/jpeg', quality);
});

export async function loadPhoto(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('This image cannot be opened. Try a JPEG or PNG photo.'));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

export async function prepareQuestionPhoto(blob: Blob, turns: number, crop: Crop = FULL_CROP): Promise<Blob> {
  const image = await loadPhoto(blob);
  if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('This photo is too large to edit here. Choose a smaller photo.');
  const rotation = ((turns % 4) + 4) % 4;
  const canvas = document.createElement('canvas');
  canvas.width = rotation % 2 ? image.naturalHeight : image.naturalWidth;
  canvas.height = rotation % 2 ? image.naturalWidth : image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Photo editing is unavailable on this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(rotation * Math.PI / 2);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  const bounds = cropPixels(canvas.width, canvas.height, crop);
  const output = document.createElement('canvas');
  output.width = bounds.width; output.height = bounds.height;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new Error('Photo editing is unavailable on this browser.');
  outputContext.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return canvasBlob(output);
}

export function cameraErrorMessage(error: unknown) {
  switch ((error as DOMException)?.name) {
    case 'NotAllowedError': return 'Camera permission is blocked. Allow camera access in your browser, or choose a photo below.';
    case 'NotFoundError': return 'No camera was found. You can choose a photo instead.';
    case 'NotReadableError': return 'The camera is busy. Close other camera apps and try again, or use your phone camera below.';
    default: return (error as Error)?.message || 'The camera could not start. Try again or choose a photo.';
  }
}

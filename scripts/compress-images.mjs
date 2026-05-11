import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const roots = ['src/assets/images', 'public'];
const exts = new Set(['.png', '.jpg', '.jpeg']);
const pngQuality = Number(process.env.PNG_QUALITY || 80);
const jpegQuality = Number(process.env.JPEG_QUALITY || 82);
const minSavingsBytes = Number(process.env.MIN_SAVINGS_BYTES || 1024);

const walk = async (dir) => {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await walk(full));
      continue;
    }
    if (exts.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
};

const toKB = (n) => `${(n / 1024).toFixed(1)} KB`;

const compressOne = async (file) => {
  const ext = path.extname(file).toLowerCase();
  const original = await fs.readFile(file);
  const img = sharp(original, { failOn: 'none' });

  let compressed;
  if (ext === '.png') {
    compressed = await img.png({
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: pngQuality
    }).toBuffer();
  } else {
    compressed = await img.jpeg({
      quality: jpegQuality,
      mozjpeg: true
    }).toBuffer();
  }

  if (compressed.length >= original.length || (original.length - compressed.length) < minSavingsBytes) {
    return { file, changed: false, before: original.length, after: original.length };
  }

  await fs.writeFile(file, compressed);
  return { file, changed: true, before: original.length, after: compressed.length };
};

const run = async () => {
  const files = [];
  for (const root of roots) {
    files.push(...await walk(root));
  }

  const results = [];
  for (const file of files) {
    try {
      results.push(await compressOne(file));
    } catch {
      // Skip unreadable or unsupported images silently.
    }
  }

  const changed = results.filter(r => r.changed);
  const before = changed.reduce((sum, r) => sum + r.before, 0);
  const after = changed.reduce((sum, r) => sum + r.after, 0);

  console.log(`Compressed ${changed.length}/${results.length} images`);
  console.log(`Saved ${toKB(before - after)} (${before ? (((before - after) / before) * 100).toFixed(1) : '0.0'}%)`);
  for (const row of changed.slice(0, 30)) {
    console.log(`${row.file}: ${toKB(row.before)} -> ${toKB(row.after)}`);
  }
};

run();

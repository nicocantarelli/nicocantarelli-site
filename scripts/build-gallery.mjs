import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const originalsDir = path.join(root, 'images', 'gallery', 'originals');
const avifDir = path.join(root, 'images', 'gallery', 'avif');
const jpgDir = path.join(root, 'images', 'gallery', 'jpg');
const indexFile = path.join(root, 'index.html');
const galleryFile = path.join(root, 'gallery.html');

const MAX_EDGE = 2000;
const STRIP_COUNT = 5;
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.tiff', '.tif', '.gif']);
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

async function listOriginals() {
  let entries;
  try {
    entries = await readdir(originalsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const filePath = path.join(originalsDir, entry.name);
    const info = await stat(filePath);
    const key = DATE_PREFIX.test(entry.name)
      ? entry.name
      : `${info.mtime.toISOString().slice(0, 10)}-${entry.name}`;
    files.push({ name: entry.name, path: filePath, mtimeMs: info.mtimeMs, key });
  }
  files.sort((a, b) => b.key.localeCompare(a.key));
  return files;
}

async function isFresh(derivativePath, sourceMtimeMs) {
  try {
    const info = await stat(derivativePath);
    return info.mtimeMs > sourceMtimeMs;
  } catch {
    return false;
  }
}

async function buildDerivatives(source) {
  const basename = path.basename(source.name, path.extname(source.name));
  const avifPath = path.join(avifDir, `${basename}.avif`);
  const jpgPath = path.join(jpgDir, `${basename}.jpg`);

  if (!(await isFresh(avifPath, source.mtimeMs))) {
    await sharp(source.path)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .avif({ quality: 63, effort: 6 })
      .toFile(avifPath);
    console.log(`avif: ${basename}.avif`);
  }
  if (!(await isFresh(jpgPath, source.mtimeMs))) {
    await sharp(source.path)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(jpgPath);
    console.log(`jpg: ${basename}.jpg`);
  }

  const { width, height } = await sharp(jpgPath).metadata();
  return { basename, width, height };
}

function pictureMarkup(entry, indent) {
  return [
    `${indent}<picture>`,
    `${indent}  <source srcset="/images/gallery/avif/${entry.basename}.avif" type="image/avif">`,
    `${indent}  <img src="/images/gallery/jpg/${entry.basename}.jpg" width="${entry.width}" height="${entry.height}" alt="" loading="lazy">`,
    `${indent}</picture>`,
  ].join('\n');
}

async function replaceRegion(file, marker, entries, indent) {
  const html = await readFile(file, 'utf8');
  const open = `<!-- ${marker}:auto -->`;
  const close = `<!-- /${marker}:auto -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Markers ${open} / ${close} not found in ${path.basename(file)}`);
  }
  const body = entries.map((entry) => pictureMarkup(entry, indent)).join('\n');
  const next = `${html.slice(0, start + open.length)}\n${body}\n${html.slice(end)}`;
  if (next !== html) {
    await writeFile(file, next);
    console.log(`updated: ${path.basename(file)}`);
  }
}

const originals = await listOriginals();
if (originals.length === 0) {
  console.log('No images in images/gallery/originals, nothing to do.');
  process.exit(0);
}

await mkdir(avifDir, { recursive: true });
await mkdir(jpgDir, { recursive: true });

const entries = [];
for (const source of originals) {
  entries.push(await buildDerivatives(source));
}

await replaceRegion(galleryFile, 'dump', entries, '      ');
await replaceRegion(indexFile, 'strip', entries.slice(0, STRIP_COUNT), '      ');
console.log(`done: ${entries.length} images, ${Math.min(STRIP_COUNT, entries.length)} in strip`);

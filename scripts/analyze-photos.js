/**
 * Analyze photos in a folder: dimensions, aspect ratio, portrait/landscape.
 * Optionally copy (and resize) to public/images/gallery and write manifest.json.
 *
 * Usage:
 *   node scripts/analyze-photos.js <sourceFolder>
 *   node scripts/analyze-photos.js <sourceFolder> --copy
 *   node scripts/analyze-photos.js <sourceFolder> --copy --resize
 *
 * Example (from wedding-invitation root):
 *   node scripts/analyze-photos.js "C:/Users/Tomco/OneDrive/Bureau/iloveimg-compressed/photos" --copy --resize
 */

const fs = require('fs');
const path = require('path');

let sizeOf;
let sharp;
try {
  sizeOf = require('image-size');
} catch {
  console.error('Run: npm install --save-dev image-size');
  process.exit(1);
}

const args = process.argv.slice(2);
const sourceFolder = args.find(a => !a.startsWith('--'));
const doCopy = args.includes('--copy');
const doResize = args.includes('--resize');

if (!sourceFolder) {
  console.error('Usage: node scripts/analyze-photos.js <sourceFolder> [--copy] [--resize]');
  process.exit(1);
}

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const GALLERY_TARGET = { width: 1200, height: 900 };
const MAX_KB = 500;

function isImage(file) {
  return IMAGE_EXT.includes(path.extname(file).toLowerCase());
}

function getRatio(width, height) {
  const r = width / height;
  const portrait = height > width;
  return { ratio: r, portrait };
}

async function analyze() {
  const resolved = path.isAbsolute(sourceFolder)
    ? sourceFolder
    : path.resolve(process.cwd(), sourceFolder);

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    console.error('Folder not found:', resolved);
    process.exit(1);
  }

  const files = fs.readdirSync(resolved).filter(isImage).sort();
  const report = [];

  for (const file of files) {
    const filePath = path.join(resolved, file);
    try {
      const dimensions = sizeOf(filePath);
      if (!dimensions || !dimensions.width || !dimensions.height) {
        report.push({ file, width: null, height: null, ratio: null, orientation: 'unknown' });
        continue;
      }
      const { width, height } = dimensions;
      const { ratio, portrait } = getRatio(width, height);
      report.push({
        file,
        width,
        height,
        ratio: Math.round(ratio * 100) / 100,
        orientation: portrait ? 'portrait' : 'landscape',
      });
    } catch (err) {
      report.push({ file, width: null, height: null, ratio: null, orientation: 'error', error: err.message });
    }
  }

  console.log('\n--- Photo analysis report ---\n');
  console.log('filename\twidth\theight\tratio\torientation');
  report.forEach(({ file, width, height, ratio, orientation }) => {
    console.log(`${file}\t${width ?? '-'}\t${height ?? '-'}\t${ratio ?? '-'}\t${orientation}`);
  });

  if (doCopy) {
    if (!sharp) {
      try {
        sharp = require('sharp');
      } catch {
        console.error('For --copy --resize run: npm install --save-dev sharp');
        process.exit(1);
      }
    }
    const galleryDir = path.join(process.cwd(), 'public', 'images', 'gallery');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }
    const manifest = [];
    for (const entry of report) {
      if (entry.orientation === 'error' || entry.width == null) continue;
      const srcPath = path.join(resolved, entry.file);
      const base = path.basename(entry.file, path.extname(entry.file));
      const destName = base + '.jpg';
      const destPath = path.join(galleryDir, destName);
      try {
        if (doResize) {
          await sharp(srcPath)
            .resize(GALLERY_TARGET.width, GALLERY_TARGET.height, { fit: 'cover' })
            .jpeg({ quality: 85, mozjpeg: true })
            .toFile(destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
        const stat = fs.statSync(destPath);
        manifest.push({
          file: destName,
          path: `/images/gallery/${destName}`,
          width: entry.width,
          height: entry.height,
          ratio: entry.ratio,
          orientation: entry.orientation,
          sizeKb: Math.round(stat.size / 1024),
        });
        console.log('Copied:', destName);
      } catch (err) {
        console.error('Failed', entry.file, err.message);
      }
    }
    const manifestPath = path.join(galleryDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('\nWrote', manifestPath);
  }

  return report;
}

analyze().catch((err) => {
  console.error(err);
  process.exit(1);
});

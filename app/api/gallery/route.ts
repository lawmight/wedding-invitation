import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { weddingConfig } from '../../../src/config/wedding-config';

/** Fisher–Yates shuffle (in-place) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), 'public/images/gallery');
    const manifestPath = path.join(galleryDir, 'manifest.json');
    const maxDisplay = weddingConfig.gallery.maxDisplay ?? 9;

    let paths: string[] = [];

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      paths = manifest.map((entry: { path: string }) => entry.path);
    } else {
      const files = fs.readdirSync(galleryDir);
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      });
      paths = imageFiles.map((file) => `/images/gallery/${file}`);
    }

    const shuffled = shuffle(paths);
    const images = shuffled.slice(0, maxDisplay);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Gallery image load error:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while loading the gallery images.',
        images: weddingConfig.gallery.images,
      },
      { status: 200 }
    );
  }
}

import path from 'path';
import fs from 'fs';
import { randomInt } from 'crypto';
import HomePage from "./HomePage";
import { weddingConfig } from '../src/config/wedding-config';

type PageProps = Readonly<{
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

/** Ensure main hero image can change on each visit (no static cache). */
export const dynamic = 'force-dynamic';

/** Pick a random main image from the gallery (portrait preferred). Changes on each request. */
function pickRandomMainImage(): string | undefined {
  try {
    const manifestPath = path.join(process.cwd(), 'public/images/gallery/manifest.json');
    if (!fs.existsSync(manifestPath)) return undefined;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const portraits = manifest.filter((e: { orientation: string }) => e.orientation === 'portrait');
    const pool = portraits.length > 0 ? portraits : manifest;
    if (pool.length === 0) return undefined;
    const index = randomInt(0, pool.length);
    return pool[index].path;
  } catch {
    return undefined;
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  if (params) await params;
  if (searchParams) await searchParams;
  const mainImageUrl = pickRandomMainImage() ?? weddingConfig.main.image;
  return <HomePage mainImageUrl={mainImageUrl} />;
}

// scripts/generate-sitemap.mjs
// Generates dist/sitemap.xml from public/lessons/index.json.
// Runs after `vite build` as a postbuild step.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LESSONS_INDEX = path.join(PROJECT_ROOT, 'public', 'lessons', 'index.json');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'sitemap.xml');

// ── CHANGE THIS ────────────────────────────────────────────────
// Your production URL, without a trailing slash.
const SITE_URL = 'https://2-web-speech-api-browser-native-eng.vercel.app';
// ───────────────────────────────────────────────────────────────

const escapeXml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const main = () => {
  // 1. Ensure dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`[sitemap] dist/ not found. Did you run "vite build" first?`);
    process.exit(1);
  }

  // 2. Read the lessons index
  let lessons = [];
  try {
    const raw = fs.readFileSync(LESSONS_INDEX, 'utf8');
    const parsed = JSON.parse(raw);
    lessons = Array.isArray(parsed?.lessons) ? parsed.lessons : [];
  } catch (err) {
    console.warn(`[sitemap] Could not read ${LESSONS_INDEX}: ${err.message}`);
    console.warn(`[sitemap] Generating sitemap with the home page only.`);
    lessons = [];
  }

  // 3. Build the URL list
  const now = new Date().toISOString();
  const urls = [];

  // Home page
  urls.push({
    loc: `${SITE_URL}/`,
    lastmod: now,
    changefreq: 'weekly',
    priority: '1.0',
  });

  // One entry per lesson
  for (const lesson of lessons) {
    if (!lesson || typeof lesson.file !== 'string') continue;
    // lesson.file is like "animals.json" → route "/lesson/animals"
    const slug = lesson.file.replace(/\.(json|dbms)$/i, '');
    if (!slug) continue;
    urls.push({
      loc: `${SITE_URL}/lesson/${encodeURIComponent(slug)}`,
      lastmod: now,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  // 4. Assemble the XML
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const u of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    lines.push(`    <priority>${u.priority}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  lines.push('');

  // 5. Write the file
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
  console.log(`[sitemap] Wrote ${urls.length} URL(s) to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
};

main();
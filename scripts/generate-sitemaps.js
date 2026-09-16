import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://akashbenniamin.github.io/WorshipCloud';
const PUBLIC_DIR = path.resolve(__dirname, '../public');

function xmlEscape(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractTanglish(q = '') {
  if (!q) return '';
  const parts = q.split(/\s+/);
  const romanParts = parts.filter(p => /^[a-z0-9]+$/i.test(p));
  return romanParts.join(' ');
}

function generateSitemaps() {
  console.log('Generating SEO Sitemaps and Crawler Directory...');

  const today = new Date().toISOString().split('T')[0];

  // 1. Load Data
  const songsIndexPath = path.join(PUBLIC_DIR, 'data/songs/songs-index.json');
  const bibleMetaPath = path.join(PUBLIC_DIR, 'data/bible-meta.json');

  if (!fs.existsSync(songsIndexPath) || !fs.existsSync(bibleMetaPath)) {
    console.error('Missing data files for sitemap generation!');
    process.exit(1);
  }

  const songsIndex = JSON.parse(fs.readFileSync(songsIndexPath, 'utf8'));
  const bibleMeta = JSON.parse(fs.readFileSync(bibleMetaPath, 'utf8'));

  console.log(`Loaded ${songsIndex.length} songs and ${bibleMeta.length} Bible books.`);

  // 2. Main Routes Sitemap (sitemap-main.xml)
  const mainRoutes = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/#bible`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${BASE_URL}/#songs`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${BASE_URL}/#projector`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/#daily`, priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/#tools`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${BASE_URL}/songs-directory.html`, priority: '0.8', changefreq: 'weekly' }
  ];

  let mainXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  mainXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const r of mainRoutes) {
    mainXml += `  <url>\n    <loc>${r.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
  }
  mainXml += `</urlset>\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-main.xml'), mainXml, 'utf8');

  // 3. Bible Sitemap (sitemap-bible.xml)
  let bibleXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  bibleXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add book overview URLs
  for (const b of bibleMeta) {
    bibleXml += `  <url>\n    <loc>${BASE_URL}/?book=${b.code}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    for (let ch = 1; ch <= b.chapters; ch++) {
      bibleXml += `  <url>\n    <loc>${BASE_URL}/?book=${b.code}&amp;chapter=${ch}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
  }
  bibleXml += `</urlset>\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-bible.xml'), bibleXml, 'utf8');

  // 4. Songs Sitemap (sitemap-songs.xml)
  let songsXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  songsXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const s of songsIndex) {
    const songUrl = `${BASE_URL}/?song=${encodeURIComponent(s.id)}`;
    songsXml += `  <url>\n    <loc>${songUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  songsXml += `</urlset>\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-songs.xml'), songsXml, 'utf8');

  // 5. Sitemap Index (sitemap.xml)
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  indexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  indexXml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-main.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  indexXml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-bible.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  indexXml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap-songs.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  indexXml += `</sitemapindex>\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), indexXml, 'utf8');

  // 6. Static Songs Crawler Directory (songs-directory.html)
  // Provides clean HTML links with both Tamil and Tanglish titles for Googlebot to easily crawl all 18,700+ songs
  let directoryHtml = `<!doctype html>
<html lang="ta">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>தமிழ் கிறிஸ்தவ பாடல்கள் வரிகள் அட்டவணை (18,700+ Tamil Christian Songs Lyrics Catalog) · Worship Cloud</title>
  <meta name="description" content="முழுமையான 18,700+ தமிழ் கிறிஸ்தவ பாடல் வரிகள் பட்டியல் (Tamil &amp; Tanglish Christian Song Lyrics Index). பாடல்களை தேட, வாசிக்க, மற்றும் சர்ச் ப்ரொஜெக்ஷனுக்கு பயன்படுத்தவும்." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${BASE_URL}/songs-directory.html" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", sans-serif; background: #0c1322; color: #f1f5f9; padding: 2rem 1rem; max-width: 1200px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #f6d365; font-size: 1.8rem; margin-bottom: 0.5rem; }
    p.sub { color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .nav-links { margin-bottom: 1.5rem; }
    .nav-links a { color: #38bdf8; text-decoration: none; margin-right: 1.2rem; font-weight: 600; }
    .nav-links a:hover { text-decoration: underline; }
    .songs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-top: 1.5rem; }
    .song-card { background: #172136; border: 1px solid #23324d; border-radius: 8px; padding: 10px 14px; text-decoration: none; color: inherit; display: block; transition: border-color 0.15s; }
    .song-card:hover { border-color: #f6d365; }
    .song-title { font-weight: 700; color: #ffffff; font-size: 0.92rem; }
    .song-tanglish { color: #94a3b8; font-size: 0.78rem; margin-top: 2px; }
  </style>
</head>
<body>
  <header>
    <h1>Worship Cloud · 18,700+ தமிழ் கிறிஸ்தவ பாடல் வரிகள்</h1>
    <p class="sub">Tamil &amp; Tanglish Christian Songs Lyrics Catalog — Search, Read, and Project.</p>
    <nav class="nav-links">
      <a href="${BASE_URL}/">முகப்பு (Home)</a>
      <a href="${BASE_URL}/#bible">வேதாகமம் (Bible)</a>
      <a href="${BASE_URL}/#songs">பாடல்கள் செயலி (Song Reader)</a>
      <a href="${BASE_URL}/#projector">சர்ச் ப்ரொஜெக்டர் (Projector)</a>
    </nav>
  </header>
  <main>
    <div class="songs-grid">
`;

  for (const s of songsIndex) {
    const rawTitle = (s.t || '').replace(/^[-—\s]+/, '').trim();
    const cleanTitle = xmlEscape(rawTitle);
    const tanglish = xmlEscape(extractTanglish(s.q));
    const songLink = `${BASE_URL}/?song=${encodeURIComponent(s.id)}`;

    directoryHtml += `      <a class="song-card" href="${songLink}">\n        <div class="song-title">${cleanTitle}</div>\n${tanglish ? `        <div class="song-tanglish">${tanglish}</div>\n` : ''}      </a>\n`;
  }

  directoryHtml += `    </div>
  </main>
</body>
</html>\n`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'songs-directory.html'), directoryHtml, 'utf8');

  console.log('✓ Successfully generated:');
  console.log('  - public/sitemap.xml (Index)');
  console.log('  - public/sitemap-main.xml (Main routes)');
  console.log('  - public/sitemap-bible.xml (1,189 Bible chapters)');
  console.log('  - public/sitemap-songs.xml (18,772 Songs)');
  console.log('  - public/songs-directory.html (Complete crawlable HTML directory)');
}

generateSitemaps();

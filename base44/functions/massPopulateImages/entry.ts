import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const UNSPLASH_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
const PEXELS_KEY = Deno.env.get('PEXELS_API_KEY');

const HUMAN_QUERIES = [
  'portrait face woman', 'man headshot close up', 'person looking camera natural',
  'professional portrait diverse', 'elderly person face', 'young adult portrait',
  'candid person street', 'woman smiling portrait', 'man serious portrait',
  'face natural lighting', 'person studio portrait', 'business headshot',
];

const AI_FACE_URLS = [
  { url: 'https://thispersondoesnotexist.com/', gender: 'unknown' },
];

async function fetchUnsplash(query, page = 1) {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30&orientation=portrait&content_filter=high`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
  );
  if (!res.ok) return [];
  const d = await res.json();
  return d.results || [];
}

async function fetchPexels(query, page = 1) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=portrait`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) return [];
  const d = await res.json();
  return d.photos || [];
}

function detectGender(text = '') {
  const t = text.toLowerCase();
  if (/woman|female|girl|lady|mother|sister/.test(t)) return 'female';
  if (/man|male|boy|guy|father|brother|gentleman/.test(t)) return 'male';
  return 'unknown';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const source = body.source || 'unsplash'; // 'unsplash' | 'pexels'
    const maxNew = body.max_new || 100;

    // Load existing URLs to avoid dupes (sample recent 3000)
    const existing = await base44.asServiceRole.entities.Image.list('-created_date', 3000);
    const existingUrls = new Set(existing.map(i => i.url));
    console.log(`[MassPopulate] DB has ${existing.length} images. Fetching up to ${maxNew} new ones from ${source}.`);

    const toInsert = [];

    for (const query of HUMAN_QUERIES) {
      if (toInsert.length >= maxNew) break;
      for (let page = 1; page <= 4; page++) {
        if (toInsert.length >= maxNew) break;

        let photos = [];
        if (source === 'pexels') {
          photos = await fetchPexels(query, page);
          for (const p of photos) {
            const url = p.src?.large || p.src?.medium;
            if (!url || existingUrls.has(url)) continue;
            existingUrls.add(url);
            const gender = detectGender(p.alt || '');
            toInsert.push({ url, is_bot: false, gender, source: 'pexels', creator: p.photographer, is_active: true, user_uploaded: false });
            if (toInsert.length >= maxNew) break;
          }
        } else {
          photos = await fetchUnsplash(query, page);
          for (const p of photos) {
            const url = p.urls?.regular;
            if (!url || existingUrls.has(url)) continue;
            existingUrls.add(url);
            const gender = detectGender((p.alt_description || '') + ' ' + (p.description || ''));
            toInsert.push({ url, is_bot: false, gender, source: 'unsplash', creator: p.user?.name, is_active: true, user_uploaded: false });
            if (toInsert.length >= maxNew) break;
          }
        }
        await new Promise(r => setTimeout(r, 80));
      }
    }

    // Bulk insert in chunks of 50
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += 50) {
      await base44.asServiceRole.entities.Image.bulkCreate(toInsert.slice(i, i + 50));
      inserted += Math.min(50, toInsert.length - i);
    }

    return Response.json({
      success: true,
      inserted,
      was_in_db: existing.length,
      total_now: existing.length + inserted,
      female: toInsert.filter(i => i.gender === 'female').length,
      male: toInsert.filter(i => i.gender === 'male').length,
      unknown: toInsert.filter(i => i.gender === 'unknown').length,
    });

  } catch (error) {
    console.error('[MassPopulate]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
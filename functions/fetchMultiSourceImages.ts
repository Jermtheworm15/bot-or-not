import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// --- Source Adapters ---
// Each returns normalized [{url, source, is_bot: false}] or []

async function fromUnsplash(count, query) {
  const key = Deno.env.get('UNSPLASH_ACCESS_KEY');
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&count=${Math.min(count, 30)}&client_id=${key}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(p => ({ url: p.urls?.regular, source: 'unsplash', is_bot: false })).filter(p => p.url);
  } catch { return []; }
}

async function fromPexels(count, query) {
  const key = Deno.env.get('PEXELS_API_KEY');
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 30)}&orientation=square`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => ({ url: p.src?.large, source: 'pexels', is_bot: false })).filter(p => p.url);
  } catch { return []; }
}

async function fromPixabay(count, query) {
  const key = Deno.env.get('PIXABAY_API_KEY');
  if (!key) return [];
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&per_page=${Math.min(count, 20)}&category=people&safesearch=true`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map(p => ({ url: p.webformatURL, source: 'pixabay', is_bot: false })).filter(p => p.url);
  } catch { return []; }
}

async function fromWikimedia(count, query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&gsrlimit=${Math.min(count, 30)}&origin=*`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    return pages
      .filter(p => p.imageinfo?.[0]?.url && /\.(jpg|jpeg|png|webp)$/i.test(p.imageinfo[0].url))
      .map(p => ({ url: p.imageinfo[0].url, source: 'wikimedia', is_bot: false }));
  } catch { return []; }
}

async function fromOpenverse(count, query) {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial,modification&page_size=${Math.min(count, 20)}&mature=false`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(p => ({ url: p.url, source: 'openverse', is_bot: false })).filter(p => p.url);
  } catch { return []; }
}

const SOURCES = { unsplash: fromUnsplash, pexels: fromPexels, pixabay: fromPixabay, wikimedia: fromWikimedia, openverse: fromOpenverse };
const SOURCE_NAMES = Object.keys(SOURCES);

// --- Main Handler ---

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { count = 20, query = 'portrait person face', save = false } = body;

    const perSource = Math.max(5, Math.ceil(count / SOURCE_NAMES.length));

    // Fetch all sources in parallel
    const settled = await Promise.allSettled(
      SOURCE_NAMES.map(name => SOURCES[name](perSource, query))
    );

    let images = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Fallback: if total < requested, pull extra from any sources that returned results
    if (images.length < count) {
      const workingSources = SOURCE_NAMES.filter((_, i) =>
        settled[i].status === 'fulfilled' && settled[i].value.length > 0
      );
      if (workingSources.length > 0) {
        const extra = Math.ceil((count - images.length) / workingSources.length);
        const extraSettled = await Promise.allSettled(
          workingSources.map(name => SOURCES[name](extra, query))
        );
        images = [...images, ...extraSettled.filter(r => r.status === 'fulfilled').flatMap(r => r.value)];
      }
    }

    // Deduplicate by URL
    const seen = new Set();
    images = images.filter(img => {
      if (!img?.url || seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    // Optionally save to database
    let saved = 0;
    if (save) {
      for (const img of images.slice(0, count)) {
        try {
          await base44.asServiceRole.entities.Image.create({
            url: img.url,
            is_bot: false,
            source: img.source,
            user_uploaded: false
          });
          saved++;
        } catch { /* skip duplicates */ }
      }
    }

    const sourceBreakdown = images.reduce((acc, img) => {
      acc[img.source] = (acc[img.source] || 0) + 1;
      return acc;
    }, {});

    return Response.json({
      success: true,
      total: images.length,
      saved,
      sources: sourceBreakdown,
      available_sources: {
        unsplash: !!Deno.env.get('UNSPLASH_ACCESS_KEY'),
        pexels: !!Deno.env.get('PEXELS_API_KEY'),
        pixabay: !!Deno.env.get('PIXABAY_API_KEY'),
        wikimedia: true,
        openverse: true,
      },
      images: save ? [] : images,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
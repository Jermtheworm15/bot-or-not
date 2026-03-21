import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Rotating person-focused queries to maximize human portrait results
const PERSON_QUERIES = [
  'human portrait face', 'woman portrait headshot', 'man portrait face',
  'person closeup', 'face portrait photography', 'professional headshot',
  'model portrait', 'person smiling face', 'human face closeup',
  'portrait photography person'
];

function randomPersonQuery() {
  return PERSON_QUERIES[Math.floor(Math.random() * PERSON_QUERIES.length)];
}

// Terms that indicate non-person images — used for metadata filtering
const REJECT_TERMS = [
  'landscape', 'building', 'architecture', 'animal', 'dog', 'cat', 'bird',
  'plant', 'flower', 'tree', 'mountain', 'ocean', 'sea', 'sky', 'sunset',
  'abstract', 'logo', 'map', 'chart', 'diagram', 'food', 'car', 'vehicle',
  'interior', 'exterior', 'nature', 'forest', 'beach', 'waterfall'
];

function hasRejectTerm(text) {
  const lower = (text || '').toLowerCase();
  return REJECT_TERMS.some(t => lower.includes(t));
}

// --- Source Adapters ---

async function fromUnsplash(count, query) {
  const key = Deno.env.get('UNSPLASH_ACCESS_KEY');
  if (!key) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&count=${Math.min(count, 30)}&client_id=${key}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter(p => p.urls?.regular && !hasRejectTerm(p.description) && !hasRejectTerm(p.alt_description))
      .map(p => ({ url: p.urls.regular, source: 'unsplash', is_bot: false }));
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
    return (data.photos || [])
      .filter(p => p.src?.large && !hasRejectTerm(p.alt))
      .map(p => ({ url: p.src.large, source: 'pexels', is_bot: false }));
  } catch { return []; }
}

async function fromPixabay(count, query) {
  const key = Deno.env.get('PIXABAY_API_KEY');
  if (!key) return [];
  try {
    // category=people is a strong filter on Pixabay
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&per_page=${Math.min(count, 20)}&category=people&safesearch=true`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || [])
      .filter(p => p.webformatURL && !hasRejectTerm(p.tags))
      .map(p => ({ url: p.webformatURL, source: 'pixabay', is_bot: false }));
  } catch { return []; }
}

async function fromWikimedia(count, query) {
  try {
    // Use portrait-specific terms for Wikimedia to filter out irrelevant results
    const wikiQuery = `portrait face person ${query} filetype:bitmap`;
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(wikiQuery)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&gsrlimit=${Math.min(count * 3, 50)}&origin=*`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    return pages
      .filter(p => {
        if (!p.imageinfo?.[0]?.url) return false;
        if (!/\.(jpg|jpeg|png|webp)$/i.test(p.imageinfo[0].url)) return false;
        // Strict title-based rejection for Wikimedia which has many non-person images
        const title = (p.title || '').toLowerCase();
        if (hasRejectTerm(title)) return false;
        const personTerms = ['portrait', 'person', 'face', 'man', 'woman', 'people', 'human', 'headshot', 'model', 'actor', 'politician', 'author'];
        return personTerms.some(t => title.includes(t));
      })
      .map(p => ({ url: p.imageinfo[0].url, source: 'wikimedia', is_bot: false }))
      .slice(0, count);
  } catch { return []; }
}

async function fromOpenverse(count, query) {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial,modification&page_size=${Math.min(count * 2, 30)}&mature=false`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter(p => {
        if (!p.url) return false;
        // Filter by tags and title
        const tagNames = (p.tags || []).map(t => (typeof t === 'string' ? t : t.name || '')).join(' ');
        if (hasRejectTerm(tagNames) || hasRejectTerm(p.title)) return false;
        return true;
      })
      .map(p => ({ url: p.url, source: 'openverse', is_bot: false }))
      .slice(0, count);
  } catch { return []; }
}

// --- LLM Face Validation (only for URLs with a detectable image extension) ---

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp)(\?|$)/i;

async function validateFaces(images, base44) {
  // Split into validatable (has image ext) and pass-through (CDN dynamic URLs)
  const toValidate = images.filter(img => IMAGE_EXT_RE.test(img.url));
  const passThrough = images.filter(img => !IMAGE_EXT_RE.test(img.url));

  if (toValidate.length === 0) return images;

  const BATCH_SIZE = 5;
  const validated = [...passThrough]; // CDN URLs pass through without LLM check

  for (let i = 0; i < toValidate.length; i += BATCH_SIZE) {
    const batch = toValidate.slice(i, i + BATCH_SIZE);
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are validating images for a "Bot or Not" game where players guess if a face is human or AI-generated.

For each of the ${batch.length} attached image(s), answer: does this image primarily feature a human face, human portrait, or humanoid figure as the MAIN subject?

ACCEPT: human faces, portraits, headshots, full/partial body of people, AI-generated human faces.
REJECT: landscapes, buildings, animals, plants, objects, abstract art, logos, food, vehicles, images with no visible person.

Respond ONLY as JSON: {"0": true, "1": false, ...} — one boolean per image index (0-based).`,
        file_urls: batch.map(img => img.url),
        response_json_schema: {
          type: 'object',
          additionalProperties: { type: 'boolean' }
        }
      });

      batch.forEach((img, idx) => {
        if (result?.[String(idx)] !== false) validated.push(img);
      });
    } catch {
      validated.push(...batch); // Keep on error
    }
  }

  return validated;
}

// --- Main Handler ---

const SOURCES = { unsplash: fromUnsplash, pexels: fromPexels, pixabay: fromPixabay, wikimedia: fromWikimedia, openverse: fromOpenverse };
const SOURCE_NAMES = Object.keys(SOURCES);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { count = 20, query, save = false, validate_faces = false } = body;

    // Use a random person-focused query if none provided
    const searchQuery = query || randomPersonQuery();

    // Fetch extra to account for filtering losses
    const fetchMultiplier = validate_faces ? 2.5 : 1.5;
    const perSource = Math.max(5, Math.ceil((count * fetchMultiplier) / SOURCE_NAMES.length));

    // Fetch all sources in parallel
    const settled = await Promise.allSettled(
      SOURCE_NAMES.map(name => SOURCES[name](perSource, searchQuery))
    );

    let images = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Fallback: top up from working sources if below requested count
    if (images.length < count) {
      const workingSources = SOURCE_NAMES.filter((_, i) =>
        settled[i].status === 'fulfilled' && settled[i].value.length > 0
      );
      if (workingSources.length > 0) {
        const extra = Math.ceil((count - images.length) / workingSources.length);
        const extraSettled = await Promise.allSettled(
          workingSources.map(name => SOURCES[name](extra, randomPersonQuery()))
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

    // AI face validation — filters out non-person images using vision LLM
    if (validate_faces && images.length > 0) {
      images = await validateFaces(images, base44);
    }

    // Save to database
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
      query: searchQuery,
      validated: validate_faces,
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
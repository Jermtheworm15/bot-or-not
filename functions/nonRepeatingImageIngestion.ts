import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  const startTime = Date.now();
  const fetchId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Keyword arrays for rotating searches
    const KEYWORD_ARRAYS = {
      ai_art: ['AI art', 'digital art', 'AI generated', 'synthetic', 'artwork', 'illustration'],
      people: ['portrait', 'person', 'face', 'human', 'people', 'headshot'],
      nature: ['landscape', 'nature', 'forest', 'mountains', 'scenery', 'outdoor'],
      tech: ['technology', 'digital', 'cyber', 'futuristic', 'tech', 'innovation'],
      abstract: ['abstract', 'geometric', 'pattern', 'colors', 'shapes', 'design']
    };

    const allKeywords = Object.values(KEYWORD_ARRAYS).flat();

    // Get or create ingestion state
    let state = (await base44.asServiceRole.entities.ImageIngestionState.list()).at(0);

    if (!state) {
      state = await base44.asServiceRole.entities.ImageIngestionState.create({
        last_page: 1,
        current_keyword_index: 0,
        total_keywords: allKeywords.length,
        fetch_count_today: 0,
        fetched_urls: [],
        active_cycles: {}
      });
    }

    // Get current keyword and rotate
    const currentKeyword = allKeywords[state.current_keyword_index % allKeywords.length];
    const nextKeywordIndex = (state.current_keyword_index + 1) % allKeywords.length;

    // Randomize page within valid range (1-50 for most APIs)
    const randomPage = Math.floor(Math.random() * 50) + 1;

    // Cache-busting timestamp
    const timestamp = Date.now();

    // Fetch from Unsplash API
    const imageData = await fetchImages(currentKeyword, randomPage, timestamp);

    // Get existing images to check for duplicates
    const existingImages = await base44.asServiceRole.entities.Image.list();
    const existingHashes = new Set(existingImages.map(img => img.perceptual_hash).filter(Boolean));
    const existingUrls = new Set(existingImages.map(img => img.url));

    // Process and deduplicate
    let addedCount = 0;
    let deduplicatedCount = 0;

    for (const image of imageData.images) {
      // Skip if URL already exists
      if (existingUrls.has(image.url)) {
        deduplicatedCount++;
        continue;
      }

      // Calculate perceptual hash (simplified)
      const hash = crypto.createHash('sha256').update(image.url).digest('hex');

      if (existingHashes.has(hash)) {
        deduplicatedCount++;
        continue;
      }

      try {
        // Add image to database
        await base44.asServiceRole.entities.Image.create({
          url: image.url,
          is_bot: image.is_bot || false,
          source: 'Unsplash',
          user_uploaded: false,
          perceptual_hash: hash,
          tags: [currentKeyword.toLowerCase(), image.alt_text?.toLowerCase() || ''].filter(Boolean),
          ai_model: 'Unknown'
        });

        addedCount++;
        existingUrls.add(image.url);
        existingHashes.add(hash);
      } catch (err) {
        console.error(`Failed to add image: ${err.message}`);
      }
    }

    // Track cycle for this keyword to prevent infinite loops
    const cycles = state.active_cycles || {};
    cycles[currentKeyword] = (cycles[currentKeyword] || 0) + 1;

    // Reset cycle counter if it exceeds safe limit
    if (cycles[currentKeyword] > 20) {
      cycles[currentKeyword] = 0;
    }

    // Update state for next fetch
    await base44.asServiceRole.entities.ImageIngestionState.update(state.id, {
      last_page: randomPage,
      current_keyword_index: nextKeywordIndex,
      fetch_count_today: state.fetch_count_today + 1,
      last_fetch_timestamp: new Date().toISOString(),
      fetched_urls: Array.from(existingUrls).slice(-1000), // Keep last 1000 URLs
      active_cycles: cycles
    });

    // Log fetch operation
    await base44.asServiceRole.entities.ImageFetchLog.create({
      fetch_id: fetchId,
      keyword: currentKeyword,
      page: randomPage,
      images_found: imageData.images.length,
      images_deduplicated: deduplicatedCount,
      images_added: addedCount,
      fetch_duration_ms: Date.now() - startTime,
      source: 'Unsplash',
      status: addedCount > 0 ? 'success' : 'partial'
    });

    return Response.json({
      success: true,
      fetch_id: fetchId,
      keyword: currentKeyword,
      page: randomPage,
      images_found: imageData.images.length,
      images_deduplicated: deduplicatedCount,
      images_added: addedCount,
      duration_ms: Date.now() - startTime,
      next_keyword_index: nextKeywordIndex
    });

  } catch (error) {
    // Log failed fetch
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.ImageFetchLog.create({
        fetch_id: fetchId,
        keyword: 'unknown',
        page: 0,
        images_found: 0,
        images_deduplicated: 0,
        images_added: 0,
        fetch_duration_ms: Date.now() - startTime,
        source: 'Unsplash',
        status: 'failed',
        error_message: error.message
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Fetch images from Unsplash API
async function fetchImages(keyword, page, timestamp) {
  const UNSPLASH_API_KEY = Deno.env.get('UNSPLASH_API_KEY');

  if (!UNSPLASH_API_KEY) {
    // Return mock data if API key not set
    return {
      images: [
        {
          url: `https://images.unsplash.com/photo-${timestamp}?w=600`,
          alt_text: keyword,
          is_bot: false
        }
      ]
    };
  }

  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', keyword);
  url.searchParams.set('page', page);
  url.searchParams.set('per_page', 20);
  url.searchParams.set('client_id', UNSPLASH_API_KEY);
  url.searchParams.set('_t', timestamp); // Cache buster

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    images: (data.results || []).map(img => ({
      url: img.urls.regular,
      alt_text: img.alt_description,
      is_bot: false
    }))
  };
}
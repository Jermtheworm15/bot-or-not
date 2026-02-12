import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const UNSPLASH_KEYWORDS = [
  'portrait', 'face', 'person', 'people', 'headshot', 'human', 'woman', 'man', 
  'professional', 'profile', 'character', 'smile', 'candid', 'close-up'
];

const AI_PROMPTS = [
  'Ultra realistic AI-generated portrait of a person, photorealistic, 8k, studio lighting',
  'AI-generated human face, highly detailed, professional headshot, cinematic lighting',
  'Photorealistic AI portrait, detailed facial features, studio background',
  'AI-generated person, realistic skin texture, natural lighting, professional',
  'Synthetic human portrait, detailed eyes, realistic proportions, modern style'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can trigger batch generation
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 5; // Generate 5 of each type by default

    const results = {
      aiGenerated: 0,
      realImages: 0,
      errors: []
    };

    // Generate AI bot images
    for (let i = 0; i < batchSize; i++) {
      try {
        const prompt = AI_PROMPTS[Math.floor(Math.random() * AI_PROMPTS.length)];
        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: prompt
        });

        await base44.asServiceRole.entities.Image.create({
          url,
          is_bot: true,
          source: 'ai_generated',
          user_uploaded: false
        });

        results.aiGenerated++;
      } catch (err) {
        results.errors.push(`AI generation ${i + 1}: ${err.message}`);
      }
    }

    // Fetch real images from Unsplash
    for (let i = 0; i < batchSize; i++) {
      try {
        const keyword = UNSPLASH_KEYWORDS[Math.floor(Math.random() * UNSPLASH_KEYWORDS.length)];
        const pageNum = Math.floor(Math.random() * 50) + 1;
        const perPage = 1;

        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${keyword}&page=${pageNum}&per_page=${perPage}&client_id=${Deno.env.get('UNSPLASH_API_KEY')}`
        );

        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const imageUrl = data.results[0].urls.regular;

          await base44.asServiceRole.entities.Image.create({
            url: imageUrl,
            is_bot: false,
            source: 'unsplash',
            user_uploaded: false,
            uploader_name: data.results[0].user.name
          });

          results.realImages++;
        }
      } catch (err) {
        results.errors.push(`Unsplash fetch ${i + 1}: ${err.message}`);
      }
    }

    // Fetch from Pexels if API key available
    if (Deno.env.get('PEXELS_API_KEY')) {
      for (let i = 0; i < Math.floor(batchSize / 2); i++) {
        try {
          const keyword = UNSPLASH_KEYWORDS[Math.floor(Math.random() * UNSPLASH_KEYWORDS.length)];
          const pageNum = Math.floor(Math.random() * 50) + 1;

          const response = await fetch(
            `https://api.pexels.com/v1/search?query=${keyword}&page=${pageNum}&per_page=1`,
            {
              headers: { 'Authorization': Deno.env.get('PEXELS_API_KEY') }
            }
          );

          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src.original;

            await base44.asServiceRole.entities.Image.create({
              url: imageUrl,
              is_bot: false,
              source: 'pexels',
              user_uploaded: false,
              uploader_name: data.photos[0].photographer
            });

            results.realImages++;
          }
        } catch (err) {
          results.errors.push(`Pexels fetch ${i + 1}: ${err.message}`);
        }
      }
    }

    return Response.json({
      success: true,
      results,
      totalAdded: results.aiGenerated + results.realImages,
      message: `Added ${results.aiGenerated} AI images and ${results.realImages} real images`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
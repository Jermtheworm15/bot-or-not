import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { count = 10, type = 'both' } = await req.json();
    const results = { images: [], videos: [] };
    
    // Fetch AI-generated images
    if (type === 'images' || type === 'both') {
      const aiImageSources = [
        'https://thispersondoesnotexist.com/',
        'https://thisartworkdoesnotexist.com/',
        'https://thiscatdoesnotexist.com/'
      ];
      
      // Use LLM to find and validate AI image sources
      const imageSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Find ${count} direct URLs to AI-generated images (faces, artwork, animals) from public sources like "This X Does Not Exist" sites, AI art galleries, or similar. Return ONLY valid, working image URLs that are publicly accessible. Each URL should be a direct link to an image file (jpg, png, webp).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            urls: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      const imageUrls = imageSearch.urls || [];
      
      // Store AI images
      for (const url of imageUrls.slice(0, count)) {
        try {
          const image = await base44.asServiceRole.entities.Image.create({
            url: url,
            is_bot: true,
            source: 'AI Generated - Public Source',
            user_uploaded: false
          });
          results.images.push(image);
        } catch (err) {
          console.log('Error storing image:', err);
        }
      }
    }
    
    // Fetch real human images/videos for comparison
    if (type === 'real' || type === 'both') {
      const realSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Find ${Math.floor(count / 2)} direct URLs to real human photos from public domain sources like Unsplash, Pexels, or similar royalty-free image sites. Focus on portrait/face photos. Return ONLY valid image URLs.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            urls: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      const realUrls = realSearch.urls || [];
      
      for (const url of realUrls) {
        try {
          const image = await base44.asServiceRole.entities.Image.create({
            url: url,
            is_bot: false,
            source: 'Real - Public Domain',
            user_uploaded: false
          });
          results.images.push(image);
        } catch (err) {
          console.log('Error storing real image:', err);
        }
      }
    }
    
    // Note: AI-generated videos are harder to source publicly
    // Most would require API keys from services like Runway, Pika, etc.
    if (type === 'videos' || type === 'both') {
      const videoSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 5 direct URLs to AI-generated videos from public sources, demo reels, or research papers. These should be short clips showing AI-generated content. Return ONLY valid video URLs (mp4, webm).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            urls: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      const videoUrls = videoSearch.urls || [];
      
      for (const url of videoUrls) {
        try {
          const video = await base44.asServiceRole.entities.Video.create({
            url: url,
            is_bot: true,
            source: 'AI Generated - Public Source',
            user_uploaded: false
          });
          results.videos.push(video);
        } catch (err) {
          console.log('Error storing video:', err);
        }
      }
    }
    
    return Response.json({
      success: true,
      message: `Added ${results.images.length} images and ${results.videos.length} videos`,
      results
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
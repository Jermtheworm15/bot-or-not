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
      // Use LLM to find and validate AI image sources from specific communities
      const imageSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Find ${count} direct URLs to AI-generated images from these specific sources:
        - AI art communities (Midjourney showcase, DALL-E gallery, Stable Diffusion community posts)
        - Public domain AI art on sites like Lexica.art, Civitai, or AI art subreddits
        - Creative Commons licensed AI images
        - "This X Does Not Exist" sites (thispersondoesnotexist.com, thisartworkdoesnotexist.com)
        
        Return ONLY direct image URLs (ending in .jpg, .png, .webp) that are:
        1. Publicly accessible without authentication
        2. Clearly AI-generated (faces, artwork, scenes)
        3. Free to use or public domain
        
        Format: Return a JSON array of URLs only.`,
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
            source: 'AI Generated - Community Source',
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
        prompt: `Find ${Math.floor(count / 2)} direct URLs to real human photos from these sources:
        - Unsplash API (via unsplash.com/photos/random)
        - Pexels free stock photos
        - Pixabay public domain images
        - Creative Commons licensed portraits
        - Public domain photo libraries
        
        Focus on portrait/face photos. Return ONLY direct image URLs that are:
        1. Royalty-free and publicly accessible
        2. Real photographs of actual people
        3. High quality and clear`,
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
            source: 'Real - Stock/Public Domain',
            user_uploaded: false
          });
          results.images.push(image);
        } catch (err) {
          console.log('Error storing real image:', err);
        }
      }
    }
    
    // Fetch AI-generated and real videos
    if (type === 'videos' || type === 'both') {
      const videoSearch = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 10 direct URLs to videos from these sources:
        - AI-generated videos from Runway ML, Pika Labs demos, or research showcases
        - Public AI video examples from tech blogs and AI company showcases
        - Creative Commons licensed AI-generated video content
        - Real human videos from stock sites (Pexels Videos, Pixabay) for comparison
        
        Return a mix of AI-generated and real videos. Each URL should be a direct video link (.mp4, .webm).
        Indicate which are AI vs real in the description.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ai_videos: {
              type: "array",
              items: { type: "string" }
            },
            real_videos: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      // Store AI videos
      const aiVideoUrls = videoSearch.ai_videos || [];
      for (const url of aiVideoUrls) {
        try {
          const video = await base44.asServiceRole.entities.Video.create({
            url: url,
            is_bot: true,
            source: 'AI Generated - Community/Demo',
            user_uploaded: false
          });
          results.videos.push(video);
        } catch (err) {
          console.log('Error storing AI video:', err);
        }
      }
      
      // Store real videos
      const realVideoUrls = videoSearch.real_videos || [];
      for (const url of realVideoUrls) {
        try {
          const video = await base44.asServiceRole.entities.Video.create({
            url: url,
            is_bot: false,
            source: 'Real - Stock Video',
            user_uploaded: false
          });
          results.videos.push(video);
        } catch (err) {
          console.log('Error storing real video:', err);
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
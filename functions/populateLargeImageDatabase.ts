import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { batchSize = 50 } = await req.json();
    
    // Diverse AI prompts for variety
    const aiPrompts = [
      "Ultra realistic portrait of a young professional woman, natural lighting, 8k",
      "Photorealistic headshot of a man in his 30s, studio quality",
      "Hyper realistic close-up portrait, professional photography",
      "Realistic portrait of a smiling person, natural features",
      "Professional headshot photo, studio lighting, sharp focus",
      "Photorealistic facial portrait, magazine quality",
      "Ultra detailed portrait of a business professional",
      "Realistic portrait photography, natural expression",
      "Professional model headshot, perfect lighting",
      "Hyper realistic portrait, commercial photography style",
      "Realistic portrait of an entrepreneur, confident expression",
      "Professional LinkedIn-style headshot photo",
      "Photorealistic portrait, natural skin texture, soft lighting",
      "Ultra realistic headshot, corporate professional style",
      "Realistic portrait with natural background, professional",
      "High-quality portrait photo, editorial style",
      "Photorealistic professional portrait, clean background",
      "Realistic facial portrait, modern photography",
      "Professional portrait with natural lighting and expression",
      "Ultra realistic headshot for business profile"
    ];

    // Real human image sources from Unsplash
    const humanIds = [
      "1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d",
      "1438761681033-6461ffad8d80", "1500648767791-00dcc994a43e",
      "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
      "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04",
      "1506794778202-cad84cf45f1d", "1524504388940-b1c1722653e1",
      "1488426862026-3ee34a7d66df", "1519085360753-af0119f7cbe7",
      "1517841905240-472988babdf9", "1529626455594-4ff0802cfb7e",
      "1539571696357-5a69c17a67c6", "1508214751196-bcfd4ca60f91",
      "1504257432389-aa4aba4fb17a", "1492562080023-ab3db95bfbce",
      "1535713875002-d1d0cf377fde", "1508835277982-1c1b0e205603"
    ];

    const newImages = [];
    const botCount = Math.floor(batchSize / 2);
    const humanCount = batchSize - botCount;

    // Generate AI bot images
    for (let i = 0; i < botCount; i++) {
      try {
        const prompt = aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
        const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        
        // Validate image URL
        const testResponse = await fetch(result.url, { method: 'HEAD' });
        if (testResponse.ok) {
          const imageRecord = await base44.asServiceRole.entities.Image.create({
            url: result.url,
            is_bot: true,
            source: 'ai_generated'
          });
          newImages.push(imageRecord);
        }
      } catch (error) {
        console.error('Failed to generate bot image:', error);
      }
    }

    // Add human images from Unsplash
    for (let i = 0; i < humanCount; i++) {
      try {
        const photoId = humanIds[Math.floor(Math.random() * humanIds.length)];
        const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80`;
        
        // Validate image URL
        const testResponse = await fetch(url, { method: 'HEAD' });
        if (testResponse.ok) {
          const imageRecord = await base44.asServiceRole.entities.Image.create({
            url,
            is_bot: false,
            source: 'unsplash'
          });
          newImages.push(imageRecord);
        }
      } catch (error) {
        console.error('Failed to add human image:', error);
      }
    }

    return Response.json({ 
      success: true, 
      created: newImages.length,
      message: `Created ${newImages.length} validated images`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
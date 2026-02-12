import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count = 6 } = await req.json();
    const botCount = Math.ceil(count / 2);
    const humanCount = Math.floor(count / 2);

    // Generate diverse bot images
    const botPrompts = [
      "Ultra realistic portrait of a young professional woman with perfect skin, studio lighting, 8k, photorealistic",
      "Hyper realistic portrait of a handsome man in his 30s, perfect features, professional photo",
      "Photorealistic close-up of a smiling person, flawless skin, natural lighting, high detail",
      "Ultra detailed portrait photography of an attractive person, professional headshot, sharp focus",
      "Realistic portrait of a business professional, studio quality, perfect composition",
      "Hyper realistic facial portrait, magazine quality, professional photography"
    ];

    const humanImageUrls = [
      `https://images.unsplash.com/photo-${Date.now() % 1000000000}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80`,
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&h=800&fit=crop&crop=faces",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop&crop=faces",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=800&fit=crop&crop=faces",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop&crop=faces",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=800&fit=crop&crop=faces"
    ];

    const newImages = [];

    // Generate bot images
    for (let i = 0; i < botCount; i++) {
      const prompt = botPrompts[Math.floor(Math.random() * botPrompts.length)];
      const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
      
      const imageRecord = await base44.asServiceRole.entities.Image.create({
        url: result.url,
        is_bot: true,
        source: 'ai_generated'
      });
      
      newImages.push(imageRecord);
    }

    // Add human images
    for (let i = 0; i < humanCount; i++) {
      const url = humanImageUrls[Math.floor(Math.random() * humanImageUrls.length)];
      
      const imageRecord = await base44.asServiceRole.entities.Image.create({
        url,
        is_bot: false,
        source: 'unsplash'
      });
      
      newImages.push(imageRecord);
    }

    return Response.json({ 
      success: true, 
      count: newImages.length,
      images: newImages 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
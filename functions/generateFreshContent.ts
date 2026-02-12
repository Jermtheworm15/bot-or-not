import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count = 6 } = await req.json();
    const targetPerType = Math.floor(count / 2);

    // Diverse bot prompts
    const botPrompts = [
      "photorealistic portrait of a young woman with curly hair",
      "professional headshot of a man with beard",
      "portrait of a person with glasses, smiling warmly",
      "realistic close-up of a teenager, casual style",
      "mature adult portrait, confident expression",
      "candid portrait of someone laughing",
      "portrait of a person in business attire",
      "realistic selfie-style portrait, natural lighting",
      "portrait of an elderly person, kind expression",
      "young professional with short hair, clean background"
    ];

    // Expanded human image IDs
    const humanIds = [
      "1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d", "1438761681033-6461ffad8d80",
      "1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
      "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04", "1506794778202-cad84cf45f1d",
      "1524504388940-b1c1722653e1", "1488426862026-3ee34a7d66df", "1519085360753-af0119f7cbe7",
      "1517841905240-472988babdf9", "1529626455594-4ff0802cfb7e", "1539571696357-5a69c17a67c6"
    ];

    const botImages = [];
    const humanImages = [];

    // Generate bot images - ensure exact count
    for (let i = 0; i < targetPerType; i++) {
      try {
        const prompt = botPrompts[Math.floor(Math.random() * botPrompts.length)];
        const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        
        const imageRecord = await base44.asServiceRole.entities.Image.create({
          url: result.url,
          is_bot: true,
          source: 'ai_generated'
        });
        botImages.push(imageRecord);
      } catch (error) {
        console.error('Bot generation error:', error);
      }
    }

    // Add human images - ensure exact count
    for (let i = 0; i < targetPerType; i++) {
      try {
        const photoId = humanIds[i % humanIds.length];
        const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80&sig=${Date.now()}-${i}`;
        
        const imageRecord = await base44.asServiceRole.entities.Image.create({
          url,
          is_bot: false,
          source: 'unsplash'
        });
        humanImages.push(imageRecord);
      } catch (error) {
        console.error('Human image error:', error);
      }
    }

    const newImages = [...botImages, ...humanImages];

    return Response.json({ 
      success: true, 
      count: newImages.length,
      bots: botImages.length,
      humans: humanImages.length,
      images: newImages 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
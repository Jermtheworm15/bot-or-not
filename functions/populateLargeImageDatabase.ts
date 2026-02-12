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
      "photorealistic portrait of a young woman with curly hair, natural daylight",
      "professional headshot of a man with beard, corporate setting",
      "portrait of a person with glasses, smiling warmly, soft studio lighting",
      "realistic close-up of a teenager, casual style, outdoor background",
      "mature adult portrait, confident expression, neutral background",
      "candid portrait of someone laughing, genuine emotion",
      "portrait of a person in business attire, modern office",
      "realistic selfie-style portrait, natural lighting, casual",
      "portrait of an elderly person, kind expression, warm tones",
      "young professional with short hair, clean background",
      "portrait with natural makeup, soft focus, lifestyle photography",
      "person in casual streetwear, urban background",
      "headshot with neutral expression, professional lighting",
      "portrait of someone with long hair, artistic lighting",
      "realistic portrait in evening light, moody atmosphere",
      "friendly face portrait, approachable expression",
      "portrait with dramatic side lighting, artistic style",
      "casual portrait at golden hour, warm sunlight",
      "professional portrait with colorful background",
      "minimalist portrait, simple composition, clear features",
      "portrait with natural freckles, authentic skin texture",
      "person wearing hat, stylish portrait, fashion photography",
      "portrait in winter clothing, cozy aesthetic",
      "summer portrait, bright and airy, beach vibe",
      "portrait with unique hairstyle, creative expression",
      "athletic person portrait, healthy lifestyle",
      "student portrait, youthful energy, campus setting",
      "artist portrait, creative personality, studio background",
      "musician portrait, passionate expression, dark background",
      "chef portrait, professional kitchen setting"
    ];

    // Expanded real human image sources from Unsplash
    const humanIds = [
      "1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d", "1438761681033-6461ffad8d80",
      "1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
      "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04", "1506794778202-cad84cf45f1d",
      "1524504388940-b1c1722653e1", "1488426862026-3ee34a7d66df", "1519085360753-af0119f7cbe7",
      "1517841905240-472988babdf9", "1529626455594-4ff0802cfb7e", "1539571696357-5a69c17a67c6",
      "1508214751196-bcfd4ca60f91", "1504257432389-aa4aba4fb17a", "1492562080023-ab3db95bfbce",
      "1535713875002-d1d0cf377fde", "1508835277982-1c1b0e205603", "1513956589380-b7c749be5e11",
      "1506863530036-1efeddceb993", "1521119989659-a83eee488004", "1499996860823-5214fcc65f8f",
      "1502685104226-ee32379fefbe", "1527980965255-d3b416303d12", "1488161628813-04466f872be2",
      "1552374196-1ab2a1c593e8", "1489424731084-a5d8b219a5bb", "1506794778202-cad84cf45f1d",
      "1474176857227-05629dcb7c2a", "1463453091185-61582044d556", "1489980557514-251d61e3eeb6",
      "1506089676908-3592e6dda1f6", "1489465142679-c1b7bafddc36", "1541647376-924c3c4c4f5c",
      "1484688493527-670f98f9b195", "1507591064344-4c6ce005b128", "1502823403499-6ccfcf4fb453",
      "1542909168-8b64f3e8d1b5", "1502767089025-6572583495f7", "1506919258185-6078bba55d2a"
    ];

    const botImages = [];
    const humanImages = [];
    const targetPerType = Math.floor(batchSize / 2);

    // Generate AI bot images - ensure we get exactly targetPerType
    let botAttempts = 0;
    while (botImages.length < targetPerType && botAttempts < targetPerType * 3) {
      botAttempts++;
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
          botImages.push(imageRecord);
        }
      } catch (error) {
        console.error('Failed to generate bot image:', error);
      }
    }

    // Add human images from Unsplash - ensure we get exactly targetPerType
    let humanAttempts = 0;
    const usedIds = new Set();
    while (humanImages.length < targetPerType && humanAttempts < targetPerType * 3) {
      humanAttempts++;
      try {
        let photoId;
        do {
          photoId = humanIds[Math.floor(Math.random() * humanIds.length)];
        } while (usedIds.has(photoId) && usedIds.size < humanIds.length);
        
        usedIds.add(photoId);
        const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80&sig=${Date.now()}`;
        
        // Validate image URL
        const testResponse = await fetch(url, { method: 'HEAD' });
        if (testResponse.ok) {
          const imageRecord = await base44.asServiceRole.entities.Image.create({
            url,
            is_bot: false,
            source: 'unsplash'
          });
          humanImages.push(imageRecord);
        }
      } catch (error) {
        console.error('Failed to add human image:', error);
      }
    }

    const newImages = [...botImages, ...humanImages];

    return Response.json({ 
      success: true, 
      created: newImages.length,
      bots: botImages.length,
      humans: humanImages.length,
      message: `Created ${botImages.length} bots and ${humanImages.length} humans (${newImages.length} total)`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
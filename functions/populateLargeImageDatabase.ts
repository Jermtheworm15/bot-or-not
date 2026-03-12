import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { batchSize = 200 } = await req.json();
    
    // Diverse AI prompts for variety - 100+ prompts
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
      "chef portrait, professional kitchen setting",
      "portrait of a woman with red hair, outdoors, natural",
      "man with glasses, professional photo, clean background",
      "portrait of someone with blonde hair, studio lighting",
      "person with dark skin, warm smile, daylight",
      "asian woman portrait, modern styling, professional",
      "african man headshot, confident pose, studio",
      "portrait with makeup, glamorous style, dramatic lighting",
      "casual street portrait, everyday person, authentic",
      "portrait in rain, moody atmosphere, cinematic",
      "portrait with flowers, artistic composition, nature",
      "business woman portrait, boardroom setting, powerful",
      "young man portrait, casual shirt, friendly expression",
      "portrait with tattoos, artistic style, creative",
      "person in jacket, outdoor urban setting, modern",
      "portrait with jewelry, elegant style, luxury",
      "woman with braids, cultural portrait, authentic",
      "man with piercing, alternative style, artistic",
      "portrait in shadows, dramatic contrast, noir style",
      "person with smile, warm skin tones, approachable",
      "headshot with natural background, bokeh, professional",
      "portrait with scarf, fashion style, elegant",
      "person with curly afro, natural beauty, confident",
      "man with long hair, alternative style, artistic",
      "portrait with cat eye makeup, bold style, editorial",
      "woman in suit, powerful portrait, leadership",
      "person with minimal makeup, fresh faced, natural",
      "portrait with earrings, glamorous, sophisticated",
      "man in beanie, casual cool style, street fashion",
      "woman with updo, formal portrait, elegant hairstyle",
      "portrait with fringe, trendy hairstyle, modern",
      "person in striped shirt, casual smart, lifestyle",
      "portrait with bold lip color, makeup focus, editorial",
      "man with sideburns, vintage style, classic portrait",
      "woman with bangs, cute portrait, casual style",
      "portrait with sunglasses, cool demeanor, edgy",
      "person in button up, professional casual, business",
      "portrait with headphones, tech savvy, modern",
      "woman with headscarf, cultural portrait, respectful",
      "man in hoodie, casual youth style, modern",
      "portrait with glasses chain, quirky style, indie",
      "person in leather jacket, rebel style, alternative",
      "portrait with pins and patches, expressive, bold",
      "woman in blazer, power portrait, executive",
      "man with mustache, distinctive feature, character",
      "portrait with nose ring, edgy style, punk",
      "person in turtleneck, sophisticated style, classic",
      "portrait with undercut hairstyle, modern, bold",
      "woman with winged eyeliner, dramatic makeup, bold",
      "man with beard trimmed neat, groomed, distinguished",
      "portrait with ombre hair, trendy, fashionable",
      "person with shaved head, confident, bold look",
      "portrait with glitter, party style, celebratory",
      "woman with natural hair, proud, authentic, beautiful",
      "man with styled quiff, vintage modern, retro cool",
      "portrait with flower crown, bohemian style, artistic",
      "person with dark lipstick, goth style, alternative",
      "portrait with sprinkles makeup, playful, fun",
      "woman with victory rolls, retro pin up, classic",
      "man in cardigan, cozy casual, comfortable style",
      "portrait with face gems, festival style, creative",
      "person in crop top, trendy, fashion forward, modern"
    ];

    // Expanded real human image sources from Unsplash - 100+ photos
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
      "1542909168-8b64f3e8d1b5", "1502767089025-6572583495f7", "1506919258185-6078bba55d2a",
      "1516321318423-f06f85e504b3", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1535083783855-76ae62b2914e", "1507592992097-4ea4dca8e5e1", "1517841905240-472988babdf9",
      "1506157786151-b8491531f063", "1502134249126-9f3755a50d78", "1529626455594-4ff0802cfb7e",
      "1515562141207-6cc2da584fe0", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1539571696357-5a69c17a67c6", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1540206351209-7615516967d7", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
      "1501126613772-bc5c5d1a88be", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1512313928289-1b34016b0560", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1517841905240-472988babdf9", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1530268729831-4c851caea40d", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1522307378919-abc5404911be", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1512909917876-f35a68e67e12", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1516252612400-c3c4dd270b38", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1502763671712-3535994f9869", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1516534775068-f6b14ad1506e", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1506531437202-1efddab72c48", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330",
      "1517841905240-472988babdf9", "1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330"
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

    // Add human images from multiple sources
    try {
      const multiResult = await base44.asServiceRole.functions.invoke('fetchMultiSourceImages', {
        count: targetPerType,
        query: 'portrait person face',
        save: true
      });
      const fetched = multiResult?.images || [];
      for (const img of fetched) {
        humanImages.push({ url: img.url, is_bot: false, source: img.source });
      }
      console.log(`Multi-source fetched ${humanImages.length} human images`);
    } catch (error) {
      console.error('Multi-source fetch error:', error);
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
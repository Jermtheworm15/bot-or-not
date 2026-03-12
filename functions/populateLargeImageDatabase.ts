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
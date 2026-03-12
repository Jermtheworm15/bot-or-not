import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const DAILY_LIMIT = 2000;
    const MAX_PER_BATCH = 6; // Very small batch to avoid timeouts
    const today = new Date().toDateString();

    // Get or create daily counter
    let dailyCounter = await base44.asServiceRole.entities.ImageCounter?.filter?.({ date: today }) || [];
    let todayCount = dailyCounter.length > 0 ? dailyCounter[0].count : 0;

    // Check if daily limit reached
    if (todayCount >= DAILY_LIMIT) {
      return Response.json({ 
        success: false,
        message: 'Daily fetch limit of 2,000 images reached',
        today_count: todayCount
      });
    }

    // 100+ rotating keywords for diverse content
    const aiKeywords = [
      "AI portrait photorealistic", "AI generated face", "synthetic human", "CGI character",
      "neural network portrait", "AI art realistic", "machine learning face", "digital human",
      "AI professional headshot", "AI fashion portrait", "AI beauty shot", "AI lifestyle",
      "synthetic person", "generated character", "AI celebrity", "digital person",
      "AI model portrait", "generated model", "synthetic model", "AI headshot",
      "AI corporate portrait", "AI influencer", "AI actor", "AI person realistic",
      "digital face", "AI anime character", "AI 3D render", "unreal engine person",
      "AI illustration", "AI painting", "AI digital art", "AI concept art",
      "AI fantasy character", "AI sci-fi character", "AI steampunk", "AI cyberpunk person",
      "AI retro portrait", "AI vintage style", "AI baroque portrait", "AI renaissance",
      "AI noir character", "AI film still", "AI movie character", "AI tv character",
      "synthetic celebrity lookalike", "AI deepfake", "AI voice actor", "AI face swap"
    ];

    const realKeywords = [
      "real person portrait", "candid photography", "professional headshot", "stock photo person",
      "documentary portrait", "lifestyle photography", "fashion model", "beauty portrait",
      "studio portrait", "natural portrait", "corporate headshot", "editorial photo",
      "street photography", "travel portrait", "cultural portrait", "environmental portrait",
      "business portrait", "professional photo", "social media person", "influencer photo",
      "couple portrait", "family photo", "group portrait", "wedding portrait",
      "engagement photo", "casual portrait", "candid moment", "everyday people",
      "authentic portrait", "real people", "genuine expression", "natural lighting",
      "outdoor portrait", "indoor portrait", "daylight portrait", "evening portrait",
      "fashion photography", "model photoshoot", "glamour portrait", "celebrity photo",
      "athlete photo", "fitness model", "lifestyle model", "product model",
      "user generated content", "authentic people", "diverse people", "multicultural"
    ];

    const totalToFetch = Math.min(MAX_PER_BATCH, DAILY_LIMIT - todayCount);
    const newImages = [];

    // Simplified: Skip deduplication and hashing to prevent timeouts
    // Just fetch and store quickly
    const aiBatchSize = Math.ceil(totalToFetch / 2);
    for (let i = 0; i < aiBatchSize && totalToFetch - newImages.length > 0; i++) {
      try {
        const keyword = aiKeywords[Math.floor(Math.random() * aiKeywords.length)];
        const result = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `photorealistic ${keyword}`
        });

        if (result?.url) {
          await base44.asServiceRole.entities.Image.create({
            url: result.url,
            is_bot: true,
            source: 'ai_generated',
            user_uploaded: false
          });
          newImages.push({ url: result.url, is_bot: true });
        }
      } catch (error) {
        console.error('AI generation error:', error);
      }
    }

    // Batch 2: Fetch real images via multi-source API function
    const realBatchSize = totalToFetch - newImages.length;
    if (realBatchSize > 0) {
      try {
        const multiResult = await base44.asServiceRole.functions.invoke('fetchMultiSourceImages', {
          count: realBatchSize,
          query: 'human portrait face person',
          save: true,
          validate_faces: true
        });
        const fetched = multiResult?.images || [];
        for (const img of fetched) {
          newImages.push({ url: img.url, is_bot: false, source: img.source });
        }
        // If multi-source returned enough, we're done; otherwise log shortfall
        if (fetched.length < realBatchSize) {
          console.log(`Multi-source returned ${fetched.length}/${realBatchSize} images`);
        }
      } catch (error) {
        console.error('Multi-source fetch error:', error);
      }
    }

    // Update daily counter
    const newCount = todayCount + newImages.length;
    if (dailyCounter.length > 0) {
      await base44.asServiceRole.entities.ImageCounter.update(dailyCounter[0].id, {
        count: newCount,
        date: today
      });
    } else {
      await base44.asServiceRole.entities.ImageCounter.create({
        date: today,
        count: newImages.length
      });
    }

    return Response.json({
      success: true,
      fetched_today: newCount,
      new_images: newImages.length,
      daily_limit: DAILY_LIMIT,
      limit_reached: newCount >= DAILY_LIMIT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
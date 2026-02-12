import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const DAILY_LIMIT = 2000;
    const MAX_PER_BATCH = 15; // Reduced from 100 to prevent timeouts
    const MAX_CONCURRENT_GENERATIONS = 3; // Limit concurrent AI image generation
    const HASH_SIMILARITY_THRESHOLD = 5; // Hamming distance threshold
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
    let skipped = 0;

    // Get existing hashes for deduplication (sample last 1000 for speed)
    const existingImages = await base44.asServiceRole.entities.Image.list('-created_date', 1000);
    const existingHashes = existingImages
      .map(img => img.data?.perceptual_hash || img.perceptual_hash)
      .filter(h => h);

    // Batch 1: Generate AI images with perceptual hashing (sequential to prevent timeout)
    const aiBatchSize = Math.ceil(totalToFetch / 2);
    let aiCount = 0;
    for (let i = 0; i < aiBatchSize && aiCount < 5 && totalToFetch - newImages.length > 0; i++) {
      try {
        const keyword = aiKeywords[Math.floor(Math.random() * aiKeywords.length)];
        const result = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `photorealistic ${keyword}`
        });

        if (result?.url) {
          const hash = await fetchAndHashImage(result.url);
          
          if (hash) {
            // Check for similar images using Hamming distance
            let isDuplicate = false;
            for (const existingHash of existingHashes) {
              if (hammingDistance(hash, existingHash) <= HASH_SIMILARITY_THRESHOLD) {
                isDuplicate = true;
                skipped++;
                break;
              }
            }

            if (!isDuplicate) {
              existingHashes.push(hash);
              await base44.asServiceRole.entities.Image.create({
                url: result.url,
                is_bot: true,
                source: 'ai_generated',
                user_uploaded: false,
                perceptual_hash: hash
              });
              newImages.push({ url: result.url, is_bot: true, hash });
              aiCount++;
            }
          }
        }
      } catch (error) {
        console.error('AI generation error:', error);
      }
    }

    // Batch 2: Fetch real images with perceptual hashing from multiple sources
    const realBatchSize = totalToFetch - newImages.length;
    
    // Expanded Unsplash photo IDs (100+)
    const unsplashIds = [
      "1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d", "1438761681033-6461ffad8d80",
      "1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1522075469751-3a6694fb2f61",
      "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04", "1506794778202-cad84cf45f1d",
      "1524504388940-b1c1722653e1", "1488426862026-3ee34a7d66df", "1519085360753-af0119f7cbe7",
      "1517841905240-472988babdf9", "1529626455594-4ff0802cfb7e", "1539571696357-5a69c17a67c6",
      "1507925925987-ab5be9b61add", "1500595046-c8ee86b20ee0", "1530268729831-4c8cc9fb9ab1",
      "1520807326895-a4488cb1b1d5", "1527482797697-8795b1a55a45", "1507009707042-cc3242eead8f",
      "1518895949257-7621c3c786d7", "1522228299822-2dc5679e49b9", "1506692692874-8d440200dcf9",
      "1511367461989-f85a1170e61c", "1509824785289-025f5b846b35", "1494995514611-89613da7ee5b",
      "1509631179639-0f1ff1d3b3f9", "1519238228701-17ee0eabf437", "1516214104703-3e2e6e773008",
      "1516534775068-ec28fbd14d1d", "1511895426328-dc8714191300", "1507033553141-da9c5d26cbbb",
      "1519904981063-b0cf448d479e", "1525727137415-bc7694702500", "1507072589019-26f40a45c0e2",
      "1506576773556-3615a67dd501", "1518235506717-428a7b1833e1", "1517457373614-b7152f800fd1",
      "1514888286974-6c03bf1da5fb", "1470252649378-9c29740ff023", "1495564975905-c8e21d1a7a9d",
      "1500422174356-32bde09ca61e", "1497206365907-3d71b3f2eccc", "1493225457127-cebf5f7e9b1e",
      "1506157786151-b8491531f063", "1526336024676-3912dd5671fc", "1509305379771-a723b20c0efd",
      "1502823692656-fa38aad00a58", "1520885688993-290467a72299", "1527529482910-70becad34512",
      "1502764613149-7a0fc8b422eb", "1503235930437-8c6293ba41f5", "1511632765486-a01980e01a18",
      "1504384308090-cb894fdbb938", "1538108149185-c82ca9b78908", "1516321318423-f06f70db51ca",
      "1519699046373-74eae41d8313", "1535083783855-76ae62b2914e", "1507003211169-0a1dd7228f2d",
      "1438761681033-6461ffad8d80", "1493714671190-d91b03fead38", "1507003211169-0a1dd7228f2d",
      "1488602040022-04e1c9a10a5f", "1505506754958-2aa28789d735", "1519046904884-53103b34b206",
      "1502050108503-541d80ba2ff8", "1507003211169-0a1dd7228f2d", "1519440195606-17a9ecf09b0d",
      "1515377331024-be59c979f886", "1511379938547-c1f69b13d835", "1507003211169-0a1dd7228f2d",
      "1516321318423-f06f70db51ca", "1522441311503-5ff59dba7938", "1511440834662-f7001ba4c718",
      "1502764613149-7a0fc8b422eb", "1519046904884-53103b34b206", "1516534775068-ec28fbd14d1d",
      "1520466809213-d2464191aa97", "1506307773671-8e4ae06f2d64", "1519915212116-7c03b6ca32b1",
      "1502693418257-7e6a5c869b19", "1517841905240-472988babdf9", "1500462918059-b1a0cb175dd1",
      "1511940175494-ace2078519da", "1512314669900-cd05c5b84e37", "1519905162816-45d8a4d73d39"
    ];
    
    // Pexels API source
    const pexelsIds = [
      "3768136", "5632283", "3807517", "3774897", "3822622",
      "7974881", "220453", "1181690", "2379004", "1181706",
      "3807517", "7974881", "2379004", "220453", "1181690"
    ];
    
    // Pixabay-style random portrait URLs
    const pixabayUrls = [
      "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg",
      "https://images.pexels.com/photos/5632283/pexels-photo-5632283.jpeg",
      "https://images.pexels.com/photos/3768136/pexels-photo-3768136.jpeg"
    ];

    for (let i = 0; i < realBatchSize && totalToFetch - newImages.length > 0; i++) {
      try {
        // Randomize source selection
        const sourceChoice = Math.floor(Math.random() * 3);
        let url;
        let source;
        
        if (sourceChoice === 0) {
          // Unsplash
          const photoId = unsplashIds[Math.floor(Math.random() * unsplashIds.length)];
          const uniqueSig = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=faces&auto=format&q=80&sig=${uniqueSig}`;
          source = 'unsplash';
        } else if (sourceChoice === 1) {
          // Pexels
          const photoId = pexelsIds[Math.floor(Math.random() * pexelsIds.length)];
          const uniqueSig = Math.random().toString(36).substr(2, 9);
          url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?w=800&h=800&fit=crop&crop=faces&auto=format&q=80`;
          source = 'pexels';
        } else {
          // Picsum Photos (Lorem Picsum)
          const randomId = Math.floor(Math.random() * 1000);
          const seed = Math.random().toString(36).substr(2, 9);
          url = `https://picsum.photos/800/800?random=${randomId}&seed=${seed}`;
          source = 'picsum';
        }

        const hash = await fetchAndHashImage(url);
        
        if (hash) {
          // Check for similar images using Hamming distance
          let isDuplicate = false;
          for (const existingHash of existingHashes) {
            if (hammingDistance(hash, existingHash) <= HASH_SIMILARITY_THRESHOLD) {
              isDuplicate = true;
              skipped++;
              break;
            }
          }

          if (!isDuplicate) {
            existingHashes.push(hash);
            await base44.asServiceRole.entities.Image.create({
              url,
              is_bot: false,
              source,
              user_uploaded: false,
              perceptual_hash: hash
            });
            newImages.push({ url, is_bot: false, hash });
          }
        }
      } catch (error) {
        console.error('Real image fetch error:', error);
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
      duplicates_skipped: skipped,
      daily_limit: DAILY_LIMIT,
      limit_reached: newCount >= DAILY_LIMIT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
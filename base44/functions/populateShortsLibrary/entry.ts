import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const shortsDatabase = [
      // Creative Commons / Public Domain Videos
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        title: 'Big Buck Bunny',
        is_bot: false,
        description: 'Animated comedy short film',
        source: 'Blender Foundation',
        category: 'animation',
        duration: 596,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        title: 'Elephants Dream',
        is_bot: false,
        description: 'Surreal adventure animation',
        source: 'Orange Open Movie Project',
        category: 'animation',
        duration: 653,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'For Bigger Blazes',
        is_bot: true,
        description: 'AI-generated fire scene',
        source: 'YouTube Test',
        category: 'nature',
        duration: 15,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        title: 'For Bigger Escapes',
        is_bot: true,
        description: 'Synthetic travel footage',
        source: 'YouTube Test',
        category: 'travel',
        duration: 15,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        title: 'For Bigger Fun',
        is_bot: false,
        description: 'Real outdoor activities',
        source: 'YouTube Test',
        category: 'sports',
        duration: 60,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        title: 'For Bigger Joyrides',
        is_bot: false,
        description: 'Vehicle action footage',
        source: 'YouTube Test',
        category: 'vehicles',
        duration: 15,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        title: 'For Bigger Meltdowns',
        is_bot: true,
        description: 'AI-rendered ice effects',
        source: 'YouTube Test',
        category: 'effects',
        duration: 15,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        title: 'Sintel',
        is_bot: false,
        description: 'Fantasy adventure animation',
        source: 'Blender Foundation',
        category: 'animation',
        duration: 888,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        title: 'Subaru Outback Test',
        is_bot: false,
        description: 'Car test drive footage',
        source: 'YouTube Test',
        category: 'vehicles',
        duration: 30,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        title: 'Tears of Steel',
        is_bot: false,
        description: 'Sci-fi short film',
        source: 'Blender Foundation',
        category: 'scifi',
        duration: 734,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        title: 'VW GTI Review',
        is_bot: false,
        description: 'Car review footage',
        source: 'YouTube Test',
        category: 'vehicles',
        duration: 30,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        title: 'Bullrun Rally',
        is_bot: false,
        description: 'Racing event coverage',
        source: 'YouTube Test',
        category: 'sports',
        duration: 30,
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        title: 'Budget Car Challenge',
        is_bot: false,
        description: 'Affordable car showcase',
        source: 'YouTube Test',
        category: 'vehicles',
        duration: 30,
        user_uploaded: false
      },
    ];

    // Add AI-generated synthetic examples (simulated)
    const aiSyntheticVideos = [
      {
        url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        title: 'AI Landscape Generator',
        is_bot: true,
        description: 'AI-generated nature scenes',
        source: 'AI Synthetic',
        category: 'ai-art',
        duration: 30,
        user_uploaded: false
      },
      {
        url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4',
        title: 'Neural Portrait',
        is_bot: true,
        description: 'AI-generated human faces',
        source: 'AI Synthetic',
        category: 'ai-art',
        duration: 20,
        user_uploaded: false
      },
      {
        url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4',
        title: 'Deepfake Demo',
        is_bot: true,
        description: 'AI face swap demonstration',
        source: 'AI Synthetic',
        category: 'ai-art',
        duration: 15,
        user_uploaded: false
      },
    ];

    const allVideos = [...shortsDatabase, ...aiSyntheticVideos];

    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const videoData of allVideos) {
      try {
        const existing = await base44.asServiceRole.entities.Video.filter({ url: videoData.url });
        
        if (existing.length > 0) {
          await base44.asServiceRole.entities.Video.update(existing[0].id, videoData);
          updated++;
        } else {
          await base44.asServiceRole.entities.Video.create(videoData);
          created++;
        }
      } catch (error) {
        failed++;
        errors.push({ video: videoData.title, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Shorts library populated: ${created} created, ${updated} updated, ${failed} failed`,
      stats: {
        created,
        updated,
        failed,
        total: allVideos.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Populate] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
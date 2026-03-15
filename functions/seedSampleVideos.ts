import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Sample video URLs (placeholder - in production these would be actual video URLs)
    const sampleVideos = [
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        is_bot: false,
        description: 'Animated short film',
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        is_bot: false,
        description: 'Creative animation',
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        is_bot: true,
        description: 'AI-generated scene',
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        is_bot: true,
        description: 'Synthetically created content',
        user_uploaded: false
      },
      {
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        is_bot: false,
        description: 'Real footage',
        user_uploaded: false
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const videoData of sampleVideos) {
      try {
        const existing = await base44.asServiceRole.entities.Video.filter({ url: videoData.url });
        
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Video.create(videoData);
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('Error seeding video:', error);
      }
    }

    return Response.json({
      success: true,
      message: `Video seeding complete: ${created} created, ${skipped} already existed`,
      created,
      skipped,
      total: sampleVideos.length
    });

  } catch (error) {
    console.error('[Seed] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
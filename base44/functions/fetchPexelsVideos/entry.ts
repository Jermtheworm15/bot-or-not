import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY');
    if (!PEXELS_API_KEY) {
      return Response.json({ error: 'PEXELS_API_KEY not configured' }, { status: 400 });
    }

    const { query = 'nature', per_page = 20 } = await req.json();

    // Fetch videos from Pexels API
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${per_page}&orientation=portrait`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const video of data.videos || []) {
      try {
        // Get vertical video file (portrait orientation)
        const videoFile = video.video_files.find(f => 
          f.quality === 'hd' && f.width < f.height
        ) || video.video_files[0];

        if (!videoFile) continue;

        const videoData = {
          url: videoFile.link,
          title: `Pexels Video ${video.id}`,
          is_bot: false,
          description: query,
          source: 'Pexels',
          category: query,
          duration: video.duration || 30,
          user_uploaded: false,
          thumbnail_url: video.image,
          creator: video.user?.name || 'Pexels'
        };

        const existing = await base44.asServiceRole.entities.Video.filter({ url: videoData.url });
        
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Video.create(videoData);
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors.push({ video_id: video.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Fetched ${data.videos?.length || 0} videos from Pexels: ${created} added, ${skipped} skipped`,
      stats: {
        fetched: data.videos?.length || 0,
        created,
        skipped,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Pexels] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
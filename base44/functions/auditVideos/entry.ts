import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allVideos = await base44.asServiceRole.entities.Video.list('-created_date', 500);
    
    const results = {
      total: allVideos.length,
      tested: 0,
      working: 0,
      broken: 0,
      duplicates: 0,
      disabled: 0,
      issues: []
    };

    const seenUrls = new Map();

    for (const video of allVideos) {
      results.tested++;

      try {
        // Check for duplicates
        if (seenUrls.has(video.url)) {
          results.duplicates++;
          results.issues.push({
            id: video.id,
            url: video.url,
            issue: 'Duplicate URL',
            action: 'Flagged'
          });
          continue;
        }
        seenUrls.set(video.url, video.id);

        // Test video URL accessibility
        const response = await fetch(video.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          results.broken++;
          results.disabled++;
          
          // Disable broken video
          await base44.asServiceRole.entities.Video.update(video.id, {
            is_active: false
          });

          results.issues.push({
            id: video.id,
            url: video.url,
            issue: `HTTP ${response.status}`,
            action: 'Disabled'
          });
        } else {
          results.working++;
          
          // Re-enable if it was disabled
          if (video.is_active === false) {
            await base44.asServiceRole.entities.Video.update(video.id, {
              is_active: true
            });
          }
        }
      } catch (error) {
        results.broken++;
        results.disabled++;
        
        // Disable on error
        try {
          await base44.asServiceRole.entities.Video.update(video.id, {
            is_active: false
          });
        } catch (updateError) {
          console.error('Failed to disable video:', updateError);
        }

        results.issues.push({
          id: video.id,
          url: video.url,
          issue: error.message,
          action: 'Disabled'
        });
      }
    }

    return Response.json({
      success: true,
      message: `Audit complete: ${results.working} working, ${results.broken} broken, ${results.duplicates} duplicates`,
      results
    });

  } catch (error) {
    console.error('[Audit] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
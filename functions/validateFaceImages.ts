import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all images
    const allImages = await base44.entities.Image.list();
    
    let validated = 0;
    let removed = 0;
    const errors = [];

    // Process images in batches to avoid overwhelming the API
    for (let i = 0; i < allImages.length; i++) {
      const image = allImages[i];
      
      try {
        // Use LLM with vision to check if image contains a face
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: 'Does this image contain a human or AI-generated face/head as the main subject? Answer with only YES or NO.',
          file_urls: [image.url],
          response_json_schema: {
            type: 'object',
            properties: {
              contains_face: {
                type: 'boolean'
              }
            }
          }
        });

        if (!response.contains_face) {
          // Delete image that doesn't contain a face
          await base44.asServiceRole.entities.Image.delete(image.id);
          removed++;
        } else {
          validated++;
        }
      } catch (err) {
        errors.push(`Image ${image.id}: ${err.message}`);
      }
      
      // Add small delay between API calls
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      total_processed: allImages.length,
      validated,
      removed,
      errors,
      message: `Processed ${allImages.length} images. Kept ${validated}, removed ${removed} non-face images.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
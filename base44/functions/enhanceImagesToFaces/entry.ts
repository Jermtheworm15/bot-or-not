import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all images
    const allImages = await base44.asServiceRole.entities.Image.list();
    
    let enhanced = 0;
    let errors = [];

    // Process images in batches
    for (let i = 0; i < allImages.length; i++) {
      const image = allImages[i];
      
      try {
        // Use LLM to analyze image and generate a face version description
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Look at this image. Describe what you see in 1-2 sentences. If it's already a clear human face, respond with "FACE_OK". If it's not a clear human face, describe how to turn it into a realistic human face.`,
          file_urls: [image.url],
          response_json_schema: {
            type: 'object',
            properties: {
              description: {
                type: 'string'
              }
            }
          }
        });

        // If it's already a good face, skip it
        if (analysis.description.includes('FACE_OK')) {
          continue;
        }

        // Generate a realistic human face based on the image
        const facePrompt = `Create a realistic, high-quality portrait of a human face. The face should be photorealistic, clear, well-lit, and appear professional. Make sure it looks like a real person.`;
        
        const { url: newUrl } = await base44.integrations.Core.GenerateImage({
          prompt: facePrompt
        });

        // Update the image URL to the new face
        await base44.asServiceRole.entities.Image.update(image.id, {
          url: newUrl
        });

        enhanced++;
      } catch (err) {
        errors.push(`Image ${image.id}: ${err.message}`);
      }
      
      // Add delay between API calls
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: true,
      total_processed: allImages.length,
      enhanced,
      errors,
      message: `Enhanced ${enhanced} images to look like human faces.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
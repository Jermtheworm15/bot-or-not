import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { imageIds } = await req.json();
    
    // If no specific images provided, process all images
    let images;
    if (imageIds && imageIds.length > 0) {
      images = await Promise.all(
        imageIds.map(id => base44.asServiceRole.entities.Image.get(id))
      );
    } else {
      images = await base44.asServiceRole.entities.Image.list('-created_date', 200);
    }

    const results = [];
    
    for (const image of images) {
      if (!image.url) continue;
      
      try {
        // Use AI to detect if image contains a face
        const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Analyze this image and determine if it shows a human or humanoid face. 
          
          Return "has_face" if:
          - There is a clear human face visible
          - There is a humanoid/robot face with recognizable facial features
          - There is a person whose face is the main subject
          
          Return "no_face" if:
          - No faces are visible
          - Only body parts without face
          - Objects, landscapes, animals (non-humanoid)
          - Abstract art or patterns
          - Text or graphics only
          
          Be strict: if there's any recognizable humanoid face, return "has_face".`,
          file_urls: [image.url],
          response_json_schema: {
            type: "object",
            properties: {
              result: { type: "string", enum: ["has_face", "no_face"] },
              confidence: { type: "string" },
              description: { type: "string" }
            }
          }
        });

        const hasFace = analysis.result === "has_face";
        const isOther = !hasFace;

        // Update the image
        await base44.asServiceRole.entities.Image.update(image.id, {
          is_other: isOther
        });

        results.push({
          id: image.id,
          url: image.url,
          is_other: isOther,
          confidence: analysis.confidence,
          description: analysis.description
        });

      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        results.push({
          id: image.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
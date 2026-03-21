import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Use AI to analyze the image
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this image and provide:
1. A list of descriptive tags (5-10 keywords that describe what's in the image)
2. A single category that best fits this image (choose from: portrait, landscape, abstract, object, animal, food, technology, art, other)
3. NSFW detection - rate if this image contains inappropriate, explicit, or NSFW content on a scale of 0-1 (0 = completely safe, 1 = explicit/NSFW)

Be thorough but concise.`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
            description: "List of descriptive tags"
          },
          category: {
            type: "string",
            description: "Best fitting category"
          },
          nsfw_score: {
            type: "number",
            description: "NSFW score from 0 to 1"
          },
          nsfw_reasoning: {
            type: "string",
            description: "Brief explanation of NSFW rating"
          }
        }
      }
    });

    return Response.json({
      success: true,
      tags: analysis.tags || [],
      category: analysis.category || 'other',
      nsfw_flag: analysis.nsfw_score > 0.5,
      nsfw_score: analysis.nsfw_score || 0,
      nsfw_reasoning: analysis.nsfw_reasoning
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
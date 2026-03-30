import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url } = await req.json();
    if (!image_url) return Response.json({ error: 'image_url required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `You are an expert AI image forensics analyst. Deeply analyze this image for signs of AI generation, manipulation, or deepfake artifacts.

Examine:
1. Facial symmetry anomalies (if face present)
2. Skin texture patterns (too smooth, repeating noise)
3. Background coherence and edge blending
4. Hair/fur rendering artifacts
5. Eye reflection consistency
6. Lighting and shadow plausibility
7. Compression artifact patterns (GAN-specific vs JPEG)
8. Frequency domain anomalies
9. Metadata inconsistencies
10. Overall composition naturalness

Return a detailed forensics report as JSON.`,
      file_urls: [image_url],
      response_json_schema: {
        type: "object",
        properties: {
          verdict: { type: "string", enum: ["AI Generated", "Likely AI", "Possibly AI", "Likely Real", "Authentic"] },
          confidence: { type: "number", description: "0-100 confidence in verdict" },
          ai_probability: { type: "number", description: "0-100 probability this is AI generated" },
          summary: { type: "string", description: "2-3 sentence plain English summary" },
          signals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                signal: { type: "string" },
                finding: { type: "string" },
                severity: { type: "string", enum: ["clean", "minor", "moderate", "severe"] },
                score: { type: "number", description: "0-100" }
              }
            }
          },
          face_detected: { type: "boolean" },
          artifacts: { type: "array", items: { type: "string" } },
          generation_model_guess: { type: "string", description: "Likely AI model if AI detected" },
          manipulation_regions: { type: "array", items: { type: "string" }, description: "Described areas of concern" },
          metadata_flags: { type: "array", items: { type: "string" } },
          overall_score: { type: "number", description: "0-100, higher = more suspicious" }
        }
      }
    });

    return Response.json({ success: true, analysis: result });
  } catch (error) {
    console.error('[Forensics]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
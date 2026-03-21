import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const AI_PROMPTS = [
  'Ultra realistic AI-generated portrait of a person, photorealistic, 8k, studio lighting, professional headshot',
  'AI-generated human face, highly detailed, professional headshot, cinematic lighting, warm skin tones',
  'Photorealistic AI portrait, detailed facial features, studio background, natural lighting',
  'AI-generated person, realistic skin texture, natural lighting, professional appearance',
  'Synthetic human portrait, detailed eyes and lips, realistic proportions, modern styling',
  'AI portrait with natural expression, detailed skin texture, warm professional lighting',
  'Realistic AI face, well-lit studio setting, professional photography style, natural colors',
  'AI-generated headshot, detailed features, studio lighting, professional appearance, friendly expression'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 10;

    let generated = 0;
    const errors = [];

    for (let i = 0; i < batchSize; i++) {
      try {
        const prompt = AI_PROMPTS[Math.floor(Math.random() * AI_PROMPTS.length)];
        
        const result = await base44.integrations.Core.GenerateImage({
          prompt: prompt
        });

        if (result.url) {
          // Use user context with admin role instead of service role for RLS bypass
          await base44.entities.Image.create({
            url: result.url,
            is_bot: true,
            source: 'ai_generated',
            user_uploaded: false
          });
          generated++;
        }
      } catch (err) {
        errors.push(`Image ${i + 1}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      generated,
      errors,
      message: `Generated ${generated} AI images`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
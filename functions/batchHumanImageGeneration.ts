import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const HUMAN_PROMPTS = [
  'Real human portrait of a person, professional headshot, natural lighting, authentic appearance',
  'Genuine human face, realistic skin texture, warm professional lighting, candid expression',
  'Real person portrait, detailed facial features, studio lighting, natural skin tones',
  'Authentic human headshot, professional photography style, natural expression, soft lighting',
  'Real human face, detailed features, professional appearance, well-lit studio setting',
  'Genuine portrait of a person, natural lighting, realistic proportions, friendly expression',
  'Real human headshot, detailed eyes and smile, professional studio background',
  'Authentic person portrait, natural features, warm lighting, professional quality'
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
        const prompt = HUMAN_PROMPTS[Math.floor(Math.random() * HUMAN_PROMPTS.length)];
        
        const result = await base44.integrations.Core.GenerateImage({
          prompt: prompt
        });

        if (result.url) {
          await base44.entities.Image.create({
            url: result.url,
            is_bot: false,
            source: 'human_images',
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
      message: `Generated ${generated} human images`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
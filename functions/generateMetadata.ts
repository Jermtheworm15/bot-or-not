import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, contentType = 'general' } = await req.json();

    if (!content) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate SEO-optimized metadata for this content about bot/AI detection:

Content: "${content}"

Provide:
1. 3 engaging title options (50-60 chars)
2. 3 meta description options (150-160 chars)
3. 5 relevant keywords
4. A catchy slug (URL-friendly)

Format as JSON with: titles (array), meta_descriptions (array), keywords (array), slug`,
      response_json_schema: {
        type: 'object',
        properties: {
          titles: {
            type: 'array',
            items: { type: 'string' }
          },
          meta_descriptions: {
            type: 'array',
            items: { type: 'string' }
          },
          keywords: {
            type: 'array',
            items: { type: 'string' }
          },
          slug: { type: 'string' }
        }
      }
    });

    return Response.json({ metadata: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, contentType = 'upload' } = await req.json();

    if (!topic) {
      return Response.json({ error: 'Topic is required' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 creative content ideas for "Bot or Not" (a game where users detect AI-generated vs real content) based on this topic: "${topic}".

For each idea, provide:
1. Content idea title
2. Brief description (1-2 sentences)
3. Why it's engaging for users
4. Suggested format (image, video, etc)

Format as JSON array with fields: title, description, engagement_reason, format`,
      response_json_schema: {
        type: 'object',
        properties: {
          ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                engagement_reason: { type: 'string' },
                format: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({ ideas: response.ideas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
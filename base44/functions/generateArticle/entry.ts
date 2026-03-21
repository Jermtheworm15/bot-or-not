import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, keywords = '', articleType = 'blog' } = await req.json();

    if (!topic) {
      return Response.json({ error: 'Topic is required' }, { status: 400 });
    }

    const keywordStr = keywords ? `Focus on these keywords: ${keywords}. ` : '';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a comprehensive blog article about "${topic}" related to AI detection and bot identification. ${keywordStr}

The article should:
1. Have an engaging introduction (2-3 sentences)
2. Include 3-4 main sections with headers
3. Provide practical insights and tips
4. End with a compelling conclusion
5. Be suitable for tech enthusiasts and general users

Format as JSON with: title, introduction, sections (array with header and content), conclusion`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          introduction: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                header: { type: 'string' },
                content: { type: 'string' }
              }
            }
          },
          conclusion: { type: 'string' }
        }
      }
    });

    return Response.json({ article: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
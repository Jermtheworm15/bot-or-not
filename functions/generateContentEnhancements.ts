import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, contentType, existingDescription } = await req.json();

    if (!topic) {
      return Response.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `You are an expert content strategist for a "Bot or Not" game platform where users vote on whether images/videos are AI-generated or real.

Topic/Content: ${topic}
${existingDescription ? `Existing description: ${existingDescription}` : ''}

Generate:
1. 2-3 engaging poll questions that would make users think about whether the content is AI-generated or real
2. A compelling 1-2 sentence description for this content
3. 5-7 relevant tags for discoverability (tags related to content type, theme, and the AI detection aspect)

Focus on questions that are thought-provoking and would get users engaged. Tags should help others find similar content.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          poll_questions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Engaging poll questions'
          },
          description: {
            type: 'string',
            description: 'Compelling content description'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Relevant tags for discoverability'
          }
        },
        required: ['poll_questions', 'description', 'tags']
      }
    });

    return Response.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Content enhancement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
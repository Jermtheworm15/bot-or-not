import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled or admin only
    const isScheduled = req.headers.get('x-automation-trigger') === 'scheduled';
    if (!isScheduled) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    // Generate AI-scored news + prediction items
    const feedResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `You are an AI content engine. Generate 12 feed items for a bot-detection / AI literacy platform.

Mix of types: 4 "news" items, 4 "prediction" items, 2 "poll" items, 2 "challenge" items.

For "news": real AI news from the last 48 hours.
For "prediction": a yes/no or A/B question about an AI trend outcome.
For "poll": a community opinion question with 3 options.
For "challenge": a mini brain-teaser about AI detection.

Return valid JSON: {"items": [
  {
    "type": "news|prediction|poll|challenge",
    "title": "short punchy title",
    "body": "2-3 sentence explanation or question",
    "company": "relevant company",
    "category": "one of: ai-models|hardware|regulation|robotics|research|funding|society",
    "hype_score": 1-10,
    "impact_score": 1-10,
    "sentiment_score": -1.0 to 1.0,
    "poll_options": ["Option A","Option B"] or [],
    "prediction_answer": "correct answer if prediction, else null",
    "tags": ["tag1","tag2"],
    "source": "publication name"
  }
]}`,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                title: { type: "string" },
                body: { type: "string" },
                company: { type: "string" },
                category: { type: "string" },
                hype_score: { type: "number" },
                impact_score: { type: "number" },
                sentiment_score: { type: "number" },
                poll_options: { type: "array", items: { type: "string" } },
                prediction_answer: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                source: { type: "string" }
              }
            }
          }
        }
      }
    });

    const items = feedResult.items || [];
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Archive old items (mark inactive)
    const oldItems = await base44.asServiceRole.entities.FeedItem.filter({ is_active: true });
    for (const old of oldItems.slice(0, 50)) {
      await base44.asServiceRole.entities.FeedItem.update(old.id, { is_active: false });
    }

    // Create new items
    const created = [];
    for (const item of items) {
      const poll_votes = {};
      if (item.poll_options?.length) {
        item.poll_options.forEach(opt => { poll_votes[opt] = 0; });
      }
      const created_item = await base44.asServiceRole.entities.FeedItem.create({
        ...item,
        poll_votes,
        is_active: true,
        expires_at: expires,
        views: 0,
        reactions: 0,
        engagement_score: (item.hype_score || 5) * (item.impact_score || 5)
      });
      created.push(created_item.id);
    }

    console.log(`[DailyFeed] Generated ${created.length} feed items`);
    return Response.json({ success: true, count: created.length });

  } catch (error) {
    console.error('[DailyFeed]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
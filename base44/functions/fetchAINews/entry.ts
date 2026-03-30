import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `You are a technology news aggregator. Provide exactly 20 current AI and tech news headlines from the past 72 hours.

Sources include: TechCrunch, The Verge, Wired, MIT Technology Review, VentureBeat, Bloomberg Technology, Reuters, ArXiv, Ars Technica, IEEE Spectrum, Nature, CNBC, BBC, Forbes, WSJ, Fortune, Engadget, ZDNet, Hacker News, Semafor.

Topics: OpenAI, Anthropic, Google DeepMind, Meta AI, xAI, Apple Intelligence, Microsoft, NVIDIA, AMD, AI regulation, AI safety, Robotics, AI healthcare, AI funding, Autonomous vehicles, open source AI.

Return ONLY valid compact JSON with no trailing commas and no comments. Use this exact format:
{"items":[{"headline":"short headline","detail":"one sentence detail","company":"CompanyName","category":"product","ticker":"NVDA","source":"TechCrunch"}]}

Categories must be one of: model-release, funding, regulation, research, product, acquisition, robotics, hardware
Ticker must be a string like "NVDA" or null if private company.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                detail: { type: "string" },
                company: { type: "string" },
                category: { type: "string" },
                ticker: { type: "string" },
                source: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ news: result.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
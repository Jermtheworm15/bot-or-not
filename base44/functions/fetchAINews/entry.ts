import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a technology news aggregator. Provide 18 current, factual AI news headlines from the past 2 weeks. Focus on: OpenAI, Anthropic, Google DeepMind, Meta AI, xAI (Grok), Mistral, Apple Intelligence, NVIDIA, Microsoft Copilot, Hugging Face, AI regulation (EU AI Act, US executive orders), AI in healthcare, robotics (Figure, Tesla Optimus), autonomous vehicles, AI model releases, AI safety research, and AI funding rounds.

Return ONLY a JSON array of objects. Each object must have:
- "headline": short punchy headline (max 12 words)
- "detail": one sentence of context (max 25 words)  
- "company": primary company or topic
- "category": one of: "model-release" | "funding" | "regulation" | "research" | "product" | "acquisition"
- "ticker": the real NASDAQ/NYSE stock ticker symbol for the primary company if it is publicly traded (e.g. NVDA, MSFT, GOOGL, META, AMZN, AAPL, TSLA, AMD, INTC, QCOM, IBM, CRM, ORCL, PLTR, AI, SOUN, BBAI). Use null if the company is private (e.g. OpenAI, Anthropic, Mistral, xAI, Figure).

Example format:
[{"headline":"NVIDIA H200 demand surges as AI training scales","detail":"Data centers are ordering record quantities of H200 chips for LLM training runs.","company":"NVIDIA","category":"product","ticker":"NVDA"}]`,
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
                category: { type: "string" }
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
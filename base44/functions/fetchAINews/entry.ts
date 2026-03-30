import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `You are a technology news aggregator pulling from 30+ sources. Provide 28 current, factual AI & tech news headlines from the past 72 hours.

Sources to draw from: TechCrunch, The Verge, Wired, MIT Technology Review, VentureBeat, Bloomberg Technology, Reuters Tech, ArXiv AI papers, Hacker News, Ars Technica, The Information, Fortune Tech, CNBC Tech, BBC Technology, The Guardian Tech, IEEE Spectrum, Nature Machine Intelligence, Science Daily AI, AI News (ainews.io), Semafor Tech, The Atlantic Tech, New York Times Tech, Washington Post Tech, Financial Times Tech, Wall Street Journal Tech, Forbes AI, Business Insider Tech, ZDNet, Engadget, 9to5Google, MacRumors, SlashDot, Protocol (archive), Platformer, Stratechery.

Topic distribution (hit ALL categories):
- OpenAI / GPT updates (3 items)
- Anthropic / Claude (2 items)  
- Google DeepMind / Gemini (2 items)
- Meta AI / Llama (2 items)
- xAI / Grok / Elon Musk AI (1 item)
- Apple Intelligence / Siri (1 item)
- Microsoft Copilot / Azure AI (2 items)
- NVIDIA / AMD hardware (2 items)
- AI regulation (EU AI Act, US exec orders, China AI rules) (2 items)
- AI safety & alignment research (2 items)
- Robotics (Figure, Boston Dynamics, Tesla Optimus, 1X) (2 items)
- AI in healthcare / biotech (1 item)
- AI funding rounds / acquisitions (2 items)
- Autonomous vehicles (Waymo, Tesla FSD, Cruise) (1 item)
- AI model benchmarks / research papers (2 items)
- Open source AI / Hugging Face (1 item)

Return ONLY a JSON object with an "items" array. Each item must have:
- "headline": punchy headline max 12 words
- "detail": one sentence context max 25 words
- "company": primary company or topic name
- "category": exactly one of: "model-release" | "funding" | "regulation" | "research" | "product" | "acquisition" | "robotics" | "hardware"
- "ticker": NASDAQ/NYSE ticker if publicly traded (NVDA, MSFT, GOOGL, META, AMZN, AAPL, TSLA, AMD, INTC, QCOM, IBM, CRM, ORCL, PLTR, AI, SOUN, BBAI, DELL, HPE, SMCI, ARM, AVGO) else null
- "source": which publication this would appear in (e.g. "MIT Tech Review", "TechCrunch", "Bloomberg")`,
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function timedCheck(name, category, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    return { name, category, status: result.status || 'ok', message: result.message, duration: Date.now() - start, details: result.details || {} };
  } catch (err) {
    return { name, category, status: 'error', message: err.message, duration: Date.now() - start, details: {} };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isScheduled = req.headers.get('x-automation-trigger') === 'scheduled';
    if (!isScheduled) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const checks = await Promise.all([
      // 1. Core entities
      timedCheck('Database — Core', 'database', async () => {
        const [images, profiles, votes] = await Promise.all([
          base44.asServiceRole.entities.Image.list('-created_date', 5),
          base44.asServiceRole.entities.UserProfile.list('-created_date', 5),
          base44.asServiceRole.entities.Vote.list('-created_date', 5)
        ]);
        return { status: 'ok', message: `${images.length} images, ${profiles.length} profiles, ${votes.length} votes` };
      }),

      // 2. Token economy
      timedCheck('Token Economy', 'database', async () => {
        const [wallets, tx] = await Promise.all([
          base44.asServiceRole.entities.TokenWallet.list('-updated_date', 5),
          base44.asServiceRole.entities.TokenTransaction.list('-created_date', 5)
        ]);
        return { status: 'ok', message: `${wallets.length} wallets, ${tx.length} recent transactions` };
      }),

      // 3. Feed system
      timedCheck('AI Feed System', 'feed', async () => {
        const items = await base44.asServiceRole.entities.FeedItem.filter({ is_active: true });
        const stale = items.length === 0;
        return {
          status: stale ? 'warning' : 'ok',
          message: stale ? 'No active feed items — regeneration recommended' : `${items.length} active feed items`,
          details: { count: items.length, needs_refresh: stale }
        };
      }),

      // 4. Arcade
      timedCheck('Arcade System', 'arcade', async () => {
        const games = await base44.asServiceRole.entities.ArcadeGame.filter({ is_active: true });
        return {
          status: games.length > 0 ? 'ok' : 'warning',
          message: `${games.length} active arcade games`
        };
      }),

      // 5. Social
      timedCheck('Social & Notifications', 'database', async () => {
        const [feed, notifs] = await Promise.all([
          base44.asServiceRole.entities.SocialFeed.list('-created_date', 5),
          base44.asServiceRole.entities.Notification.list('-created_date', 5)
        ]);
        return { status: 'ok', message: `${feed.length} feed items, ${notifs.length} notifications` };
      }),

      // 6. AI Response Validation
      timedCheck('AI Response Validation', 'ai_response', async () => {
        const testResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: 'Reply with only valid JSON: {"status":"ok","test":true}',
          response_json_schema: {
            type: 'object',
            properties: { status: { type: 'string' }, test: { type: 'boolean' } }
          }
        });
        const valid = testResult?.status === 'ok' && testResult?.test === true;
        return {
          status: valid ? 'ok' : 'warning',
          message: valid ? 'AI responding correctly to structured prompts' : 'AI response format drift detected'
        };
      }),

      // 7. Marketplace
      timedCheck('Marketplace', 'database', async () => {
        const listings = await base44.asServiceRole.entities.MarketplaceListing.filter({ is_active: true });
        return { status: 'ok', message: `${listings.length} active marketplace listings` };
      }),

      // 8. Ticker Link Validation
      timedCheck('Ticker Link Health', 'links', async () => {
        const testTickers = ['NVDA', 'MSFT', 'GOOGL'];
        const results = await Promise.all(testTickers.map(async (t) => {
          const url = `https://finance.yahoo.com/quote/${t}`;
          try {
            const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
            return { ticker: t, ok: res.ok || res.status < 500, status: res.status };
          } catch { return { ticker: t, ok: false, status: 0 }; }
        }));
        const failed = results.filter(r => !r.ok);
        return {
          status: failed.length === 0 ? 'ok' : failed.length < testTickers.length ? 'warning' : 'error',
          message: failed.length === 0
            ? `All ${testTickers.length} Yahoo Finance ticker links healthy`
            : `${failed.length} ticker links degraded: ${failed.map(f => f.ticker).join(', ')}`,
          details: { results }
        };
      }),

      // 9. External Link Spot-Check
      timedCheck('External Link Health', 'links', async () => {
        const links = [
          'https://arxiv.org',
          'https://openai.com',
          'https://huggingface.co'
        ];
        const results = await Promise.all(links.map(async (url) => {
          try {
            const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
            return { url, ok: res.ok || res.status < 500, latencyMs: 0 };
          } catch { return { url, ok: false }; }
        }));
        const failed = results.filter(r => !r.ok);
        return {
          status: failed.length === 0 ? 'ok' : 'warning',
          message: failed.length === 0 ? 'External reference links reachable' : `${failed.length} external links unreachable`,
          details: { results }
        };
      }),

      // 10. Image Pool Health
      timedCheck('Image Pool', 'database', async () => {
        const total = await base44.asServiceRole.entities.Image.list('-created_date', 500);
        const botCount = total.filter(i => i.is_bot === true).length;
        const humanCount = total.filter(i => i.is_bot === false).length;
        const ratio = humanCount > 0 ? (botCount / humanCount).toFixed(2) : '∞';
        const balanced = botCount > 50 && humanCount > 50;
        return {
          status: balanced ? 'ok' : 'warning',
          message: `${total.length} total images | ${botCount} AI / ${humanCount} human | ratio: ${ratio}`,
          details: { total: total.length, botCount, humanCount, ratio }
        };
      }),
    ]);

    // Persist logs for errors/warnings
    for (const check of checks) {
      if (check.status !== 'ok') {
        await base44.asServiceRole.entities.SystemLog.create({
          log_type: check.status === 'error' ? 'error' : 'warning',
          category: check.category,
          message: `[${check.name}] ${check.message}`,
          severity: check.status === 'error' ? 'high' : 'medium',
          duration_ms: check.duration,
          details: check.details || {}
        });
      }
    }

    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');
    const overallStatus = hasErrors ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

    // Auto-fix: regenerate feed if stale
    const feedCheck = checks.find(c => c.name === 'AI Feed System');
    let autoFixes = [];
    if (feedCheck?.details?.needs_refresh) {
      try {
        await base44.asServiceRole.functions.invoke('generateDailyFeed', {});
        autoFixes.push('Regenerated stale AI feed');
        await base44.asServiceRole.entities.SystemLog.create({
          log_type: 'fix_applied',
          category: 'feed',
          message: 'Auto-regenerated stale AI feed items',
          auto_fixed: true,
          fix_description: 'Called generateDailyFeed to restore content',
          severity: 'low',
          resolved: true
        });
      } catch (e) {
        console.error('[Health] Auto-fix feed failed:', e.message);
      }
    }

    return Response.json({
      success: !hasErrors,
      overall_status: overallStatus,
      checks,
      auto_fixes: autoFixes,
      total_duration_ms: checks.reduce((s, c) => s + c.duration, 0),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Health Check]', error);
    return Response.json({ error: error.message, success: false, overall_status: 'unhealthy' }, { status: 500 });
  }
});
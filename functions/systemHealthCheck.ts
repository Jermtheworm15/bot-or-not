import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const checks = [];
    const startTime = Date.now();

    // 1. Entity Health Check
    try {
      const [images, games, profiles, votes] = await Promise.all([
        base44.asServiceRole.entities.Image.list('-created_date', 5),
        base44.asServiceRole.entities.ArcadeGame.list('-created_date', 5),
        base44.asServiceRole.entities.UserProfile.list('-created_date', 5),
        base44.asServiceRole.entities.Vote.list('-created_date', 5)
      ]);

      checks.push({
        name: 'Database Entities',
        status: 'ok',
        message: `${images.length} images, ${games.length} games, ${profiles.length} profiles, ${votes.length} votes`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      checks.push({
        name: 'Database Entities',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }

    // 2. Reward System Check
    try {
      const wallets = await base44.asServiceRole.entities.TokenWallet.list('-updated_date', 5);
      const transactions = await base44.asServiceRole.entities.TokenTransaction.list('-created_date', 10);
      
      checks.push({
        name: 'Token Economy',
        status: 'ok',
        message: `${wallets.length} active wallets, ${transactions.length} recent transactions`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      checks.push({
        name: 'Token Economy',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }

    // 3. Social Features Check
    try {
      const [feed, notifications, messages] = await Promise.all([
        base44.asServiceRole.entities.SocialFeed.list('-created_date', 5),
        base44.asServiceRole.entities.Notification.list('-created_date', 5),
        base44.asServiceRole.entities.Message.list('-created_date', 5)
      ]);
      
      checks.push({
        name: 'Social Features',
        status: 'ok',
        message: `${feed.length} feed items, ${notifications.length} notifications, ${messages.length} messages`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      checks.push({
        name: 'Social Features',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }

    // 4. Arcade System Check
    try {
      const [arcadeGames, stats, scores] = await Promise.all([
        base44.asServiceRole.entities.ArcadeGame.filter({ is_active: true }),
        base44.asServiceRole.entities.ArcadeStats.list('-updated_date', 10),
        base44.asServiceRole.entities.ArcadeScore.list('-created_date', 10)
      ]);
      
      checks.push({
        name: 'Arcade System',
        status: arcadeGames.length > 0 ? 'ok' : 'warning',
        message: `${arcadeGames.length} active games, ${stats.length} player stats, ${scores.length} recent scores`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      checks.push({
        name: 'Arcade System',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }

    // 5. Marketplace Check
    try {
      const [listings, collectibles, trades] = await Promise.all([
        base44.asServiceRole.entities.MarketplaceListing.filter({ is_active: true }),
        base44.asServiceRole.entities.ImageCollectible.list('-created_date', 5),
        base44.asServiceRole.entities.TradeOffer.list('-created_date', 5)
      ]);
      
      checks.push({
        name: 'Marketplace',
        status: 'ok',
        message: `${listings.length} active listings, ${collectibles.length} collectibles, ${trades.length} trade offers`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      checks.push({
        name: 'Marketplace',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }

    const totalDuration = Date.now() - startTime;
    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');

    return Response.json({
      success: !hasErrors,
      overall_status: hasErrors ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy',
      checks,
      total_duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Health Check] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false,
      overall_status: 'unhealthy'
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const games = await base44.asServiceRole.entities.ArcadeGame.list();
    
    // Native game IDs (games we have components for)
    const nativeGames = [
      'reaction-test', 'memory-match', 'pixel-runner', 'dodge-master',
      'speed-clicker', 'color-match', 'type-racer', 'pattern-memory',
      'pixel-snake', 'snake-retro', 'flappy-bird', 'breakout-arcade',
      'brick-breaker-retro', 'match3-gems', 'gem-matcher', 'endless-runner',
      'subway-surfer', 'jetpack-fly', 'parkour-jump', 'whack-mole',
      'fruit-ninja', 'bubble-pop', 'target-shooter', 'quick-click',
      'simon-says', 'card-flip', 'sequence-recall'
    ];

    let updated = 0;

    for (const game of games) {
      let shouldUpdate = false;
      let updates = {};

      // Set embed_type if not set
      if (!game.embed_type) {
        if (nativeGames.includes(game.game_id)) {
          updates.embed_type = 'native';
        } else if (game.embed_url) {
          updates.embed_type = 'iframe';
        } else {
          updates.embed_type = 'native'; // Default to native for future implementation
        }
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await base44.asServiceRole.entities.ArcadeGame.update(game.id, updates);
        updated++;
      }
    }

    return Response.json({
      success: true,
      message: `Updated ${updated} games`,
      totalGames: games.length
    });

  } catch (error) {
    console.error('[Fix Error]:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
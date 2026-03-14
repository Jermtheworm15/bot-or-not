import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if games already exist
    const existing = await base44.asServiceRole.entities.ArcadeGame.list();
    if (existing.length > 0) {
      return Response.json({ 
        success: true, 
        message: 'Games already seeded',
        count: existing.length 
      });
    }

    const games = [
      {
        game_id: 'reaction-test',
        name: 'Reaction Test',
        description: 'Test your reflexes! Click when the screen turns green.',
        category: 'reaction',
        difficulty: 'easy',
        icon: '⚡',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.01,
          streak_bonus: 5,
          daily_limit: 10
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'memory-match',
        name: 'Memory Match',
        description: 'Match all the pairs in the fewest moves possible.',
        category: 'memory',
        difficulty: 'medium',
        icon: '🧠',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.02,
          streak_bonus: 10,
          daily_limit: 8
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'pixel-runner',
        name: 'Pixel Runner',
        description: 'Jump over obstacles and survive as long as you can!',
        category: 'runner',
        difficulty: 'medium',
        icon: '🏃',
        is_active: true,
        reward_config: {
          base_tokens: 20,
          score_multiplier: 0.05,
          streak_bonus: 15,
          daily_limit: 5
        },
        high_score: 0,
        total_plays: 0
      }
    ];

    for (const game of games) {
      await base44.asServiceRole.entities.ArcadeGame.create(game);
    }

    return Response.json({
      success: true,
      message: 'Arcade games seeded successfully',
      count: games.length
    });

  } catch (error) {
    console.error('[Seed] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
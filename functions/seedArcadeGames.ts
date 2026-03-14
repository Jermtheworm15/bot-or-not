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
      },
      {
        game_id: 'dodge-master',
        name: 'Dodge Master',
        description: 'Move to avoid falling obstacles and survive!',
        category: 'dodge',
        difficulty: 'medium',
        icon: '🎯',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.03,
          streak_bonus: 10,
          daily_limit: 8
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'speed-clicker',
        name: 'Speed Clicker',
        description: 'Click as many targets as possible in 30 seconds!',
        category: 'reaction',
        difficulty: 'easy',
        icon: '👆',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.015,
          streak_bonus: 8,
          daily_limit: 10
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'color-match',
        name: 'Color Match',
        description: 'Match the color with the word as fast as you can!',
        category: 'puzzle',
        difficulty: 'hard',
        icon: '🎨',
        is_active: true,
        reward_config: {
          base_tokens: 25,
          score_multiplier: 0.04,
          streak_bonus: 20,
          daily_limit: 6
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'type-racer',
        name: 'Type Racer',
        description: 'Type words as fast as you can in 60 seconds!',
        category: 'timing',
        difficulty: 'medium',
        icon: '⌨️',
        is_active: true,
        reward_config: {
          base_tokens: 18,
          score_multiplier: 0.025,
          streak_bonus: 12,
          daily_limit: 7
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'pattern-memory',
        name: 'Pattern Memory',
        description: 'Remember and repeat the color sequence!',
        category: 'memory',
        difficulty: 'hard',
        icon: '🔷',
        is_active: true,
        reward_config: {
          base_tokens: 22,
          score_multiplier: 0.035,
          streak_bonus: 18,
          daily_limit: 6
        },
        high_score: 0,
        total_plays: 0
      },
      {
        game_id: 'pixel-snake',
        name: 'Pixel Snake',
        description: 'Classic snake game - eat food and grow!',
        category: 'arcade',
        difficulty: 'medium',
        icon: '🐍',
        is_active: true,
        reward_config: {
          base_tokens: 20,
          score_multiplier: 0.05,
          streak_bonus: 15,
          daily_limit: 7
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
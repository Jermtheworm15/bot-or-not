import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const retroGames = [
      // Platformer Adventures
      {
        game_id: 'pixel-jumper',
        name: 'Pixel Jumper',
        description: 'Classic platformer with coins and obstacles',
        category: 'platformer',
        difficulty: 'medium',
        icon: '🏃',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'sky-climber',
        name: 'Sky Climber',
        description: 'Climb platforms to reach the top',
        category: 'platformer',
        difficulty: 'hard',
        icon: '⛰️',
        embed_type: 'component',
        reward_config: { base_tokens: 25, score_multiplier: 0.25, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'cave-explorer',
        name: 'Cave Explorer',
        description: 'Navigate underground caves and collect gems',
        category: 'platformer',
        difficulty: 'medium',
        icon: '💎',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },

      // Adventure Puzzle
      {
        game_id: 'maze-quest',
        name: 'Maze Quest',
        description: 'Find your way through challenging mazes',
        category: 'adventure',
        difficulty: 'medium',
        icon: '🗺️',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.15, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'dungeon-crawler',
        name: 'Dungeon Crawler',
        description: 'Explore dungeons and collect treasure',
        category: 'adventure',
        difficulty: 'hard',
        icon: '🏰',
        embed_type: 'component',
        reward_config: { base_tokens: 25, score_multiplier: 0.2, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'temple-run-retro',
        name: 'Temple Run',
        description: 'Navigate ancient temple corridors',
        category: 'adventure',
        difficulty: 'medium',
        icon: '🏛️',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },

      // Racing Games
      {
        game_id: 'retro-racer',
        name: 'Retro Racer',
        description: 'Classic top-down racing action',
        category: 'racing',
        difficulty: 'medium',
        icon: '🏎️',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.15, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'speed-demon',
        name: 'Speed Demon',
        description: 'High-speed racing challenge',
        category: 'racing',
        difficulty: 'hard',
        icon: '🔥',
        embed_type: 'component',
        reward_config: { base_tokens: 25, score_multiplier: 0.2, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'drift-master',
        name: 'Drift Master',
        description: 'Master the art of drifting',
        category: 'racing',
        difficulty: 'hard',
        icon: '💨',
        embed_type: 'component',
        reward_config: { base_tokens: 25, score_multiplier: 0.25, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },

      // Shooter Games
      {
        game_id: 'space-invaders-retro',
        name: 'Space Invaders',
        description: 'Defend against alien invasion',
        category: 'shooter',
        difficulty: 'medium',
        icon: '👾',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'galactic-defender',
        name: 'Galactic Defender',
        description: 'Protect the galaxy from enemies',
        category: 'shooter',
        difficulty: 'hard',
        icon: '🚀',
        embed_type: 'component',
        reward_config: { base_tokens: 25, score_multiplier: 0.25, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'laser-blast',
        name: 'Laser Blast',
        description: 'Fast-paced laser shooting action',
        category: 'shooter',
        difficulty: 'medium',
        icon: '⚡',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },

      // Endless Runners
      {
        game_id: 'endless-dash',
        name: 'Endless Dash',
        description: 'Run forever and dodge obstacles',
        category: 'runner',
        difficulty: 'medium',
        icon: '🏃',
        embed_type: 'component',
        reward_config: { base_tokens: 15, score_multiplier: 0.15, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'sky-runner',
        name: 'Sky Runner',
        description: 'Run through the clouds',
        category: 'runner',
        difficulty: 'medium',
        icon: '☁️',
        embed_type: 'component',
        reward_config: { base_tokens: 15, score_multiplier: 0.15, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'neon-dash',
        name: 'Neon Dash',
        description: 'Futuristic endless running',
        category: 'runner',
        difficulty: 'hard',
        icon: '💫',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.2, streak_bonus: 15, daily_limit: 10 },
        is_active: true
      },

      // Puzzle Games
      {
        game_id: 'block-drop',
        name: 'Block Drop',
        description: 'Match and clear falling blocks',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '🧱',
        embed_type: 'component',
        reward_config: { base_tokens: 15, score_multiplier: 0.1, streak_bonus: 5, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'gem-swap',
        name: 'Gem Swap',
        description: 'Swap gems to create matches',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '💠',
        embed_type: 'component',
        reward_config: { base_tokens: 15, score_multiplier: 0.1, streak_bonus: 5, daily_limit: 10 },
        is_active: true
      },
      {
        game_id: 'color-chain',
        name: 'Color Chain',
        description: 'Create color chains for points',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🌈',
        embed_type: 'component',
        reward_config: { base_tokens: 20, score_multiplier: 0.15, streak_bonus: 10, daily_limit: 10 },
        is_active: true
      },
    ];

    const results = { created: 0, updated: 0, errors: [] };

    for (const gameData of retroGames) {
      try {
        const existing = await base44.asServiceRole.entities.ArcadeGame.filter({ game_id: gameData.game_id });
        
        if (existing.length > 0) {
          await base44.asServiceRole.entities.ArcadeGame.update(existing[0].id, gameData);
          results.updated++;
        } else {
          await base44.asServiceRole.entities.ArcadeGame.create(gameData);
          results.created++;
        }
      } catch (error) {
        results.errors.push({ game: gameData.game_id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Retro arcade seeded: ${results.created} created, ${results.updated} updated`,
      results,
      total_games: retroGames.length
    });

  } catch (error) {
    console.error('[Seed] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Comprehensive game library - 50+ games across all categories
    const expandedGames = [
      // === CLASSIC ARCADE CLONES ===
      {
        game_id: 'tetris-classic',
        name: 'Block Puzzle',
        description: 'Classic falling blocks puzzle game',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🧱',
        embed_url: 'https://blockpuzzle.io/embed',
        embed_type: 'iframe',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.15,
          streak_bonus: 8,
          daily_limit: 10
        }
      },
      {
        game_id: 'snake-retro',
        name: 'Snake Classic',
        description: 'Eat food and grow without hitting walls',
        category: 'arcade',
        difficulty: 'easy',
        icon: '🐍',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.12,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'pacman-clone',
        name: 'Dot Chomper',
        description: 'Collect dots while avoiding ghosts',
        category: 'arcade',
        difficulty: 'medium',
        icon: '👾',
        embed_url: 'https://free-pacman.org/embed',
        embed_type: 'iframe',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'breakout-arcade',
        name: 'Brick Breaker',
        description: 'Break all the bricks with your ball',
        category: 'arcade',
        difficulty: 'easy',
        icon: '🧱',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.1,
          streak_bonus: 5,
          daily_limit: 10
        }
      },
      {
        game_id: 'asteroids-space',
        name: 'Asteroid Blaster',
        description: 'Destroy asteroids in deep space',
        category: 'arcade',
        difficulty: 'medium',
        icon: '🚀',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'galaga-shooter',
        name: 'Space Invader',
        description: 'Shoot down waves of alien invaders',
        category: 'arcade',
        difficulty: 'medium',
        icon: '👽',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },

      // === PUZZLE GAMES ===
      {
        game_id: '2048-numbers',
        name: '2048 Challenge',
        description: 'Combine numbers to reach 2048',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🔢',
        embed_url: 'https://play2048.co/embed',
        embed_type: 'iframe',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.2,
          streak_bonus: 10,
          daily_limit: 8
        }
      },
      {
        game_id: 'sudoku-puzzle',
        name: 'Number Grid',
        description: 'Complete the 9x9 number puzzle',
        category: 'puzzle',
        difficulty: 'hard',
        icon: '🧮',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 20,
          score_multiplier: 0.25,
          streak_bonus: 12,
          daily_limit: 6
        }
      },
      {
        game_id: 'match3-gems',
        name: 'Gem Matcher',
        description: 'Match 3 or more gems to clear',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '💎',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.12,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'sliding-puzzle',
        name: 'Slide Puzzle',
        description: 'Rearrange tiles to complete image',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🧩',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.15,
          streak_bonus: 7,
          daily_limit: 8
        }
      },
      {
        game_id: 'word-search',
        name: 'Word Hunter',
        description: 'Find hidden words in the grid',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '🔤',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.1,
          streak_bonus: 5,
          daily_limit: 10
        }
      },
      {
        game_id: 'mahjong-tiles',
        name: 'Tile Match',
        description: 'Match pairs of identical tiles',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🀄',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 8
        }
      },

      // === REACTION GAMES ===
      {
        game_id: 'whack-mole',
        name: 'Whack-a-Mole',
        description: 'Hit the moles as they pop up',
        category: 'reaction',
        difficulty: 'easy',
        icon: '🔨',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.1,
          streak_bonus: 5,
          daily_limit: 10
        }
      },
      {
        game_id: 'fruit-ninja',
        name: 'Fruit Slicer',
        description: 'Slice flying fruits, avoid bombs',
        category: 'reaction',
        difficulty: 'medium',
        icon: '🍉',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'bubble-pop',
        name: 'Bubble Popper',
        description: 'Pop matching colored bubbles',
        category: 'reaction',
        difficulty: 'easy',
        icon: '🫧',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.11,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'target-shooter',
        name: 'Target Practice',
        description: 'Hit targets with precision timing',
        category: 'reaction',
        difficulty: 'medium',
        icon: '🎯',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'quick-click',
        name: 'Speed Clicker',
        description: 'Click as fast as you can',
        category: 'reaction',
        difficulty: 'easy',
        icon: '⚡',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 8,
          score_multiplier: 0.08,
          streak_bonus: 4,
          daily_limit: 12
        }
      },

      // === RUNNER GAMES ===
      {
        game_id: 'endless-runner',
        name: 'Infinite Sprint',
        description: 'Run and jump over obstacles',
        category: 'runner',
        difficulty: 'easy',
        icon: '🏃',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.12,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'subway-surfer',
        name: 'Rail Runner',
        description: 'Dodge trains and collect coins',
        category: 'runner',
        difficulty: 'medium',
        icon: '🚇',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'jetpack-fly',
        name: 'Jetpack Hero',
        description: 'Fly through obstacles with your jetpack',
        category: 'runner',
        difficulty: 'medium',
        icon: '🚀',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'parkour-jump',
        name: 'Rooftop Runner',
        description: 'Jump between buildings',
        category: 'runner',
        difficulty: 'hard',
        icon: '🏙️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.18,
          streak_bonus: 9,
          daily_limit: 8
        }
      },

      // === PLATFORMER GAMES ===
      {
        game_id: 'mario-jump',
        name: 'Platform Hero',
        description: 'Jump through levels and collect coins',
        category: 'runner',
        difficulty: 'medium',
        icon: '🍄',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.15,
          streak_bonus: 8,
          daily_limit: 8
        }
      },
      {
        game_id: 'cave-escape',
        name: 'Cave Explorer',
        description: 'Navigate through dangerous caves',
        category: 'runner',
        difficulty: 'hard',
        icon: '⛏️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.17,
          streak_bonus: 9,
          daily_limit: 8
        }
      },

      // === MEMORY GAMES ===
      {
        game_id: 'simon-says',
        name: 'Pattern Master',
        description: 'Remember and repeat the sequence',
        category: 'memory',
        difficulty: 'medium',
        icon: '🔴',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.15,
          streak_bonus: 8,
          daily_limit: 8
        }
      },
      {
        game_id: 'card-flip',
        name: 'Card Memory',
        description: 'Find matching pairs of cards',
        category: 'memory',
        difficulty: 'easy',
        icon: '🎴',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.12,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'sequence-recall',
        name: 'Number Sequence',
        description: 'Remember the number order',
        category: 'memory',
        difficulty: 'hard',
        icon: '🔢',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.18,
          streak_bonus: 9,
          daily_limit: 8
        }
      },

      // === TIMING GAMES ===
      {
        game_id: 'stack-tower',
        name: 'Tower Stacker',
        description: 'Stack blocks as high as possible',
        category: 'timing',
        difficulty: 'medium',
        icon: '🏗️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'flappy-bird',
        name: 'Flappy Challenge',
        description: 'Navigate through pipe gaps',
        category: 'timing',
        difficulty: 'hard',
        icon: '🐦',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.2,
          streak_bonus: 10,
          daily_limit: 8
        }
      },
      {
        game_id: 'jump-rope',
        name: 'Jump Master',
        description: 'Time your jumps perfectly',
        category: 'timing',
        difficulty: 'medium',
        icon: '🪢',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'rhythm-beats',
        name: 'Beat Tapper',
        description: 'Tap to the rhythm',
        category: 'timing',
        difficulty: 'medium',
        icon: '🎵',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.15,
          streak_bonus: 8,
          daily_limit: 10
        }
      },

      // === STRATEGY GAMES ===
      {
        game_id: 'tower-defense',
        name: 'Tower Defense',
        description: 'Build towers to stop enemies',
        category: 'puzzle',
        difficulty: 'hard',
        icon: '🗼',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 18,
          score_multiplier: 0.2,
          streak_bonus: 10,
          daily_limit: 6
        }
      },
      {
        game_id: 'chess-puzzle',
        name: 'Chess Tactics',
        description: 'Solve chess puzzles',
        category: 'puzzle',
        difficulty: 'hard',
        icon: '♟️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 20,
          score_multiplier: 0.25,
          streak_bonus: 12,
          daily_limit: 5
        }
      },

      // === CASUAL GAMES ===
      {
        game_id: 'solitaire-cards',
        name: 'Card Solitaire',
        description: 'Classic card sorting game',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '🃏',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.1,
          streak_bonus: 5,
          daily_limit: 10
        }
      },
      {
        game_id: 'bubble-shooter',
        name: 'Bubble Shooter',
        description: 'Match and pop bubbles',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '⚪',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.11,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'bejeweled-match',
        name: 'Jewel Swap',
        description: 'Match gems in rows',
        category: 'puzzle',
        difficulty: 'easy',
        icon: '💍',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.12,
          streak_bonus: 6,
          daily_limit: 10
        }
      },

      // === SPORTS & RACING ===
      {
        game_id: 'racing-drift',
        name: 'Speed Racer',
        description: 'Race through traffic',
        category: 'arcade',
        difficulty: 'medium',
        icon: '🏎️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.14,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'basketball-shot',
        name: 'Hoop Shooter',
        description: 'Make as many baskets as possible',
        category: 'reaction',
        difficulty: 'medium',
        icon: '🏀',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },
      {
        game_id: 'golf-mini',
        name: 'Mini Golf',
        description: 'Complete courses in fewest strokes',
        category: 'timing',
        difficulty: 'medium',
        icon: '⛳',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.15,
          streak_bonus: 8,
          daily_limit: 8
        }
      },
      {
        game_id: 'pool-billiards',
        name: '8-Ball Pool',
        description: 'Sink all your balls',
        category: 'timing',
        difficulty: 'hard',
        icon: '🎱',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.18,
          streak_bonus: 9,
          daily_limit: 8
        }
      },

      // === ADVENTURE & ACTION ===
      {
        game_id: 'dungeon-crawler',
        name: 'Dungeon Quest',
        description: 'Explore dungeons and fight monsters',
        category: 'arcade',
        difficulty: 'hard',
        icon: '⚔️',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 18,
          score_multiplier: 0.2,
          streak_bonus: 10,
          daily_limit: 6
        }
      },
      {
        game_id: 'zombie-survival',
        name: 'Zombie Wave',
        description: 'Survive waves of zombies',
        category: 'arcade',
        difficulty: 'hard',
        icon: '🧟',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 15,
          score_multiplier: 0.18,
          streak_bonus: 9,
          daily_limit: 8
        }
      },

      // === QUICK GAMES ===
      {
        game_id: 'balloon-pop',
        name: 'Balloon Blaster',
        description: 'Pop balloons before they escape',
        category: 'reaction',
        difficulty: 'easy',
        icon: '🎈',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 8,
          score_multiplier: 0.09,
          streak_bonus: 5,
          daily_limit: 12
        }
      },
      {
        game_id: 'tap-rush',
        name: 'Tap Frenzy',
        description: 'Tap colored buttons in sequence',
        category: 'reaction',
        difficulty: 'easy',
        icon: '🎨',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 8,
          score_multiplier: 0.08,
          streak_bonus: 4,
          daily_limit: 12
        }
      },
      {
        game_id: 'color-switch',
        name: 'Color Switcher',
        description: 'Match colors as they change',
        category: 'reaction',
        difficulty: 'medium',
        icon: '🌈',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      },

      // === RETRO CLASSICS ===
      {
        game_id: 'pong-classic',
        name: 'Retro Pong',
        description: 'Classic paddle ball game',
        category: 'arcade',
        difficulty: 'easy',
        icon: '🏓',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.1,
          streak_bonus: 5,
          daily_limit: 10
        }
      },
      {
        game_id: 'brick-breaker-retro',
        name: 'Retro Breakout',
        description: 'Classic brick breaking',
        category: 'arcade',
        difficulty: 'easy',
        icon: '🧱',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 10,
          score_multiplier: 0.11,
          streak_bonus: 6,
          daily_limit: 10
        }
      },
      {
        game_id: 'space-shooter-retro',
        name: 'Retro Shooter',
        description: 'Classic space shooting',
        category: 'arcade',
        difficulty: 'medium',
        icon: '🛸',
        embed_type: 'native',
        is_active: true,
        reward_config: {
          base_tokens: 12,
          score_multiplier: 0.13,
          streak_bonus: 7,
          daily_limit: 10
        }
      }
    ];

    // Check which games already exist
    const existingGames = await base44.asServiceRole.entities.ArcadeGame.list();
    const existingIds = new Set(existingGames.map(g => g.game_id));

    // Filter out games that already exist
    const newGames = expandedGames.filter(g => !existingIds.has(g.game_id));

    if (newGames.length === 0) {
      return Response.json({
        success: true,
        message: 'All expanded games already seeded',
        totalGames: existingGames.length,
        categories: {
          arcade: existingGames.filter(g => g.category === 'arcade').length,
          puzzle: existingGames.filter(g => g.category === 'puzzle').length,
          reaction: existingGames.filter(g => g.category === 'reaction').length,
          memory: existingGames.filter(g => g.category === 'memory').length,
          timing: existingGames.filter(g => g.category === 'timing').length,
          runner: existingGames.filter(g => g.category === 'runner').length
        }
      });
    }

    // Bulk create new games
    await base44.asServiceRole.entities.ArcadeGame.bulkCreate(newGames);

    return Response.json({
      success: true,
      message: `Successfully added ${newGames.length} new games`,
      newGamesAdded: newGames.length,
      totalGames: existingGames.length + newGames.length,
      categories: {
        arcade: expandedGames.filter(g => g.category === 'arcade').length,
        puzzle: expandedGames.filter(g => g.category === 'puzzle').length,
        reaction: expandedGames.filter(g => g.category === 'reaction').length,
        memory: expandedGames.filter(g => g.category === 'memory').length,
        timing: expandedGames.filter(g => g.category === 'timing').length,
        runner: expandedGames.filter(g => g.category === 'runner').length
      }
    });

  } catch (error) {
    console.error('[Arcade Seed Error]:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch games from GameDistribution
    const gdResult = await base44.functions.invoke('fetchGameDistribution', {});
    const gdGames = gdResult.data?.games || [];

    // Additional HTML5 game sources (free embeddable games)
    const additionalGames = [
      // More racing games
      { game_id: 'rally-point-4', name: 'Rally Point 4', category: 'racing', difficulty: 'medium', icon: '🏎️', embed_url: 'https://www.gamearter.com/games/rally_point_4', embed_type: 'iframe' },
      { game_id: 'drag-racing', name: 'Drag Racing', category: 'racing', difficulty: 'easy', icon: '🏁', embed_url: 'https://games.cdn.famobi.com/html5games/d/drag-racing-rivals', embed_type: 'iframe' },
      { game_id: 'parking-fury', name: 'Parking Fury 3D', category: 'racing', difficulty: 'medium', icon: '🅿️', embed_url: 'https://yandex.com/games/app/148978', embed_type: 'iframe' },
      
      // More puzzle games
      { game_id: 'unblock-me', name: 'Unblock Me', category: 'puzzle', difficulty: 'medium', icon: '🧩', embed_url: 'https://games.cdn.famobi.com/html5games/u/unblock-me', embed_type: 'iframe' },
      { game_id: 'crossword-puzzle', name: 'Daily Crossword', category: 'puzzle', difficulty: 'medium', icon: '📝', embed_url: 'https://games.cdn.famobi.com/html5games/c/crossword', embed_type: 'iframe' },
      { game_id: 'word-search', name: 'Word Search', category: 'puzzle', difficulty: 'easy', icon: '🔤', embed_url: 'https://games.cdn.famobi.com/html5games/w/word-search', embed_type: 'iframe' },
      { game_id: 'jigsaw-puzzle', name: 'Jigsaw Puzzle', category: 'puzzle', difficulty: 'easy', icon: '🖼️', embed_url: 'https://games.cdn.famobi.com/html5games/j/jigsaw', embed_type: 'iframe' },
      { game_id: 'solitaire-classic', name: 'Klondike Solitaire', category: 'puzzle', difficulty: 'easy', icon: '🃏', embed_url: 'https://games.cdn.famobi.com/html5games/k/klondike-solitaire', embed_type: 'iframe' },
      { game_id: 'spider-solitaire', name: 'Spider Solitaire', category: 'puzzle', difficulty: 'medium', icon: '🕷️', embed_url: 'https://games.cdn.famobi.com/html5games/s/spider-solitaire', embed_type: 'iframe' },
      { game_id: 'freecell', name: 'FreeCell Solitaire', category: 'puzzle', difficulty: 'medium', icon: '🎴', embed_url: 'https://games.cdn.famobi.com/html5games/f/freecell', embed_type: 'iframe' },
      
      // More action games
      { game_id: 'super-smash-flash', name: 'Super Smash Flash 2', category: 'action', difficulty: 'hard', icon: '💥', embed_url: 'https://www.mcleodgaming.com/games/ssf2', embed_type: 'iframe' },
      { game_id: 'stick-war', name: 'Stick War', category: 'strategy', difficulty: 'hard', icon: '⚔️', embed_url: 'https://www.crazygames.com/game/stick-war', embed_type: 'iframe' },
      { game_id: 'happy-wheels', name: 'Happy Wheels', category: 'action', difficulty: 'medium', icon: '🛞', embed_url: 'https://www.totaljerkface.com/happy_wheels.tjf', embed_type: 'iframe' },
      
      // More sports games
      { game_id: 'basketball-legends', name: 'Basketball Legends', category: 'sports', difficulty: 'medium', icon: '🏀', embed_url: 'https://games.cdn.famobi.com/html5games/b/basketball-legends', embed_type: 'iframe' },
      { game_id: 'tennis-masters', name: 'Tennis Masters', category: 'sports', difficulty: 'medium', icon: '🎾', embed_url: 'https://games.cdn.famobi.com/html5games/t/tennis-masters', embed_type: 'iframe' },
      { game_id: 'pool-8-ball', name: '8 Ball Pool', category: 'sports', difficulty: 'medium', icon: '🎱', embed_url: 'https://games.cdn.famobi.com/html5games/p/pool-8-ball', embed_type: 'iframe' },
      { game_id: 'bowling-king', name: 'Bowling King', category: 'sports', difficulty: 'easy', icon: '🎳', embed_url: 'https://games.cdn.famobi.com/html5games/b/bowling-king', embed_type: 'iframe' },
      
      // Classic arcade
      { game_id: 'galaga-wars', name: 'Galaga Wars', category: 'arcade', difficulty: 'medium', icon: '👾', embed_url: 'https://www.crazygames.com/game/galaga-wars', embed_type: 'iframe' },
      { game_id: 'missile-command', name: 'Missile Command', category: 'arcade', difficulty: 'hard', icon: '🚀', embed_url: 'https://www.retrogames.cc/arcade-games/missile-command.html', embed_type: 'iframe' },
      { game_id: 'frogger-classic', name: 'Frogger', category: 'arcade', difficulty: 'medium', icon: '🐸', embed_url: 'https://www.retrogames.cc/arcade-games/frogger.html', embed_type: 'iframe' },
      { game_id: 'donkey-kong', name: 'Donkey Kong', category: 'arcade', difficulty: 'hard', icon: '🦍', embed_url: 'https://www.retrogames.cc/arcade-games/donkey-kong.html', embed_type: 'iframe' },
      { game_id: 'dig-dug', name: 'Dig Dug', category: 'arcade', difficulty: 'medium', icon: '⛏️', embed_url: 'https://www.retrogames.cc/arcade-games/dig-dug.html', embed_type: 'iframe' },
      
      // More casual games
      { game_id: 'doodle-jump', name: 'Doodle Jump', category: 'casual', difficulty: 'easy', icon: '📝', embed_url: 'https://poki.com/en/g/doodle-jump', embed_type: 'iframe' },
      { game_id: 'bloons-td', name: 'Bloons Tower Defense', category: 'strategy', difficulty: 'medium', icon: '🎈', embed_url: 'https://www.crazygames.com/game/bloons-tower-defense', embed_type: 'iframe' },
      { game_id: 'cookieclicker', name: 'Cookie Clicker', category: 'casual', difficulty: 'easy', icon: '🍪', embed_url: 'https://orteil.dashnet.org/cookieclicker', embed_type: 'iframe' },
      { game_id: 'geometry-dash', name: 'Geometry Dash', category: 'action', difficulty: 'hard', icon: '🔺', embed_url: 'https://scratch.mit.edu/projects/105500895/embed', embed_type: 'iframe' }
    ];

    // Add reward configs to additional games
    const processedAdditionalGames = additionalGames.map(game => ({
      ...game,
      description: `Play ${game.name} - A ${game.difficulty} ${game.category} game`,
      reward_config: {
        base_tokens: game.difficulty === 'easy' ? 10 : game.difficulty === 'medium' ? 15 : 20,
        score_multiplier: game.difficulty === 'easy' ? 0.1 : game.difficulty === 'medium' ? 0.15 : 0.2,
        streak_bonus: 5,
        daily_limit: 10
      },
      is_active: true,
      high_score: 0,
      total_plays: 0,
      tags: [game.category, game.difficulty, 'html5', 'browser']
    }));

    // Combine all games
    const allGames = [...gdGames, ...processedAdditionalGames];

    // Check for duplicates and insert
    const existingGames = await base44.asServiceRole.entities.ArcadeGame.list();
    const existingGameIds = new Set(existingGames.map(g => g.game_id));
    
    const newGames = allGames.filter(g => !existingGameIds.has(g.game_id));
    
    if (newGames.length > 0) {
      await base44.asServiceRole.entities.ArcadeGame.bulkCreate(newGames);
    }

    // Get category breakdown
    const byCategory = {};
    for (const game of allGames) {
      byCategory[game.category] = (byCategory[game.category] || 0) + 1;
    }

    return Response.json({
      success: true,
      totalGames: allGames.length,
      newGames: newGames.length,
      duplicatesSkipped: allGames.length - newGames.length,
      byCategory,
      message: `Seeded ${newGames.length} new games (${allGames.length} total in catalog)`
    });

  } catch (error) {
    console.error('[Massive Arcade] Seed error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});
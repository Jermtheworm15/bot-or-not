import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const games = await base44.asServiceRole.entities.ArcadeGame.list();
    const stats = await base44.asServiceRole.entities.ArcadeStats.list();
    const scores = await base44.asServiceRole.entities.ArcadeScore.list();

    const audit = {
      totalGames: games.length,
      activeGames: games.filter(g => g.is_active !== false).length,
      inactiveGames: games.filter(g => g.is_active === false).length,
      
      byCategory: {
        arcade: games.filter(g => g.category === 'arcade').length,
        puzzle: games.filter(g => g.category === 'puzzle').length,
        reaction: games.filter(g => g.category === 'reaction').length,
        memory: games.filter(g => g.category === 'memory').length,
        timing: games.filter(g => g.category === 'timing').length,
        runner: games.filter(g => g.category === 'runner').length
      },
      
      byDifficulty: {
        easy: games.filter(g => g.difficulty === 'easy').length,
        medium: games.filter(g => g.difficulty === 'medium').length,
        hard: games.filter(g => g.difficulty === 'hard').length
      },

      embedTypes: {
        native: games.filter(g => g.embed_type === 'native').length,
        iframe: games.filter(g => g.embed_type === 'iframe').length,
        unknown: games.filter(g => !g.embed_type).length
      },

      gameplay: {
        totalPlays: stats.reduce((sum, s) => sum + (s.games_played || 0), 0),
        uniquePlayers: new Set(stats.map(s => s.user_email)).size,
        totalScores: scores.length,
        averageScorePerGame: scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0
      },

      topGames: games
        .map(g => ({
          name: g.name,
          game_id: g.game_id,
          plays: stats.filter(s => s.game_id === g.game_id).reduce((sum, s) => sum + (s.games_played || 0), 0),
          players: new Set(stats.filter(s => s.game_id === g.game_id).map(s => s.user_email)).size
        }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10),

      issues: [],
      recommendations: []
    };

    // Check for issues
    games.forEach(game => {
      if (!game.reward_config) {
        audit.issues.push(`${game.name}: Missing reward configuration`);
      }
      if (!game.icon) {
        audit.issues.push(`${game.name}: Missing icon`);
      }
      if (!game.description) {
        audit.issues.push(`${game.name}: Missing description`);
      }
      if (game.embed_type === 'iframe' && !game.embed_url) {
        audit.issues.push(`${game.name}: iframe type but no embed_url`);
      }
    });

    // Generate recommendations
    if (audit.byCategory.arcade < 5) {
      audit.recommendations.push('Consider adding more arcade games');
    }
    if (audit.byCategory.puzzle < 5) {
      audit.recommendations.push('Consider adding more puzzle games');
    }
    if (audit.gameplay.uniquePlayers < 10) {
      audit.recommendations.push('Promote arcade to increase player engagement');
    }
    if (audit.issues.length > 0) {
      audit.recommendations.push(`Fix ${audit.issues.length} configuration issues`);
    }

    return Response.json({
      success: true,
      audit,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Audit Error]:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
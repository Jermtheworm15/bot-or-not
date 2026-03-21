import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [games, stats, scores, profiles] = await Promise.all([
      base44.asServiceRole.entities.ArcadeGame.list(),
      base44.asServiceRole.entities.ArcadeStats.list(),
      base44.asServiceRole.entities.ArcadeScore.list('-score', 100),
      base44.asServiceRole.entities.UserProfile.list()
    ]);

    // Category distribution
    const byCategory = {};
    const byDifficulty = {};
    const byEmbedType = {};
    
    games.forEach(game => {
      byCategory[game.category] = (byCategory[game.category] || 0) + 1;
      byDifficulty[game.difficulty] = (byDifficulty[game.difficulty] || 0) + 1;
      byEmbedType[game.embed_type || 'unknown'] = (byEmbedType[game.embed_type || 'unknown'] || 0) + 1;
    });

    // Player engagement metrics
    const uniquePlayers = new Set(stats.map(s => s.user_email)).size;
    const totalPlays = stats.reduce((sum, s) => sum + (s.games_played || 0), 0);
    const totalTokensEarned = stats.reduce((sum, s) => sum + (s.total_tokens_earned || 0), 0);
    
    // Top games by popularity
    const gamePlayCounts = {};
    stats.forEach(stat => {
      if (!gamePlayCounts[stat.game_id]) {
        gamePlayCounts[stat.game_id] = { plays: 0, players: 0 };
      }
      gamePlayCounts[stat.game_id].plays += stat.games_played || 0;
      gamePlayCounts[stat.game_id].players++;
    });

    const topGames = Object.entries(gamePlayCounts)
      .map(([game_id, data]) => {
        const game = games.find(g => g.game_id === game_id);
        return {
          game_id,
          name: game?.name || 'Unknown',
          plays: data.plays,
          players: data.players
        };
      })
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20);

    // Trending games (high activity in recent plays)
    const recentScores = scores.slice(0, 50);
    const trendingCounts = {};
    recentScores.forEach(score => {
      trendingCounts[score.game_id] = (trendingCounts[score.game_id] || 0) + 1;
    });

    const trending = Object.entries(trendingCounts)
      .map(([game_id, count]) => {
        const game = games.find(g => g.game_id === game_id);
        return {
          game_id,
          name: game?.name || 'Unknown',
          category: game?.category,
          recentPlays: count
        };
      })
      .sort((a, b) => b.recentPlays - a.recentPlays)
      .slice(0, 10);

    // Health checks
    const issues = [];
    
    // Check for games without embed URLs
    const gamesWithoutEmbed = games.filter(g => !g.embed_url && !g.embed_type);
    if (gamesWithoutEmbed.length > 0) {
      issues.push({
        type: 'missing_embed',
        severity: 'high',
        count: gamesWithoutEmbed.length,
        message: `${gamesWithoutEmbed.length} games missing embed configuration`
      });
    }

    // Check for inactive games
    const inactiveGames = games.filter(g => g.is_active === false);
    if (inactiveGames.length > 0) {
      issues.push({
        type: 'inactive_games',
        severity: 'low',
        count: inactiveGames.length,
        message: `${inactiveGames.length} games are inactive`
      });
    }

    // Player retention metrics
    const arcadeProfiles = profiles.filter(p => p.arcade_stats && p.arcade_stats.total_games_played > 0);
    const avgGamesPerPlayer = arcadeProfiles.length > 0 
      ? arcadeProfiles.reduce((sum, p) => sum + (p.arcade_stats.total_games_played || 0), 0) / arcadeProfiles.length 
      : 0;

    const recommendations = [];
    
    if (games.length < 100) {
      recommendations.push('Consider expanding game library to 100+ titles for better variety');
    }
    
    if (uniquePlayers < 10) {
      recommendations.push('Promote arcade to increase player base');
    }
    
    if (totalPlays < 100) {
      recommendations.push('Add onboarding tutorial or featured games section');
    }

    return Response.json({
      success: true,
      portal: {
        totalGames: games.length,
        activeGames: games.filter(g => g.is_active !== false).length,
        inactiveGames: inactiveGames.length,
        byCategory,
        byDifficulty,
        byEmbedType
      },
      engagement: {
        totalPlays,
        uniquePlayers,
        totalTokensDistributed: totalTokensEarned,
        avgGamesPerPlayer: Math.round(avgGamesPerPlayer * 10) / 10,
        totalScoresRecorded: scores.length
      },
      topGames,
      trending,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Portal Audit] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});
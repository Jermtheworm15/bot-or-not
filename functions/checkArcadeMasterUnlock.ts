import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const UNLOCK_REQUIREMENTS = {
  min_games: 50,
  min_total_score: 10000,
  min_different_games: 3
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already unlocked
    const existing = await base44.entities.ArcadeMaster.filter({ user_email: user.email });
    if (existing.length > 0 && existing[0].unlocked) {
      return Response.json({
        success: true,
        unlocked: true,
        already_unlocked: true
      });
    }

    // Get user's arcade stats
    const allStats = await base44.entities.ArcadeStats.filter({ user_email: user.email });

    const totalGames = allStats.reduce((sum, s) => sum + (s.games_played || 0), 0);
    const totalScore = allStats.reduce((sum, s) => sum + (s.best_score || 0), 0);
    const differentGames = allStats.length;

    const meetsRequirements = 
      totalGames >= UNLOCK_REQUIREMENTS.min_games &&
      totalScore >= UNLOCK_REQUIREMENTS.min_total_score &&
      differentGames >= UNLOCK_REQUIREMENTS.min_different_games;

    if (meetsRequirements) {
      // Unlock Arcade Master
      if (existing.length > 0) {
        await base44.entities.ArcadeMaster.update(existing[0].id, {
          unlocked: true,
          unlock_date: new Date().toISOString()
        });
      } else {
        await base44.entities.ArcadeMaster.create({
          user_email: user.email,
          unlocked: true,
          unlock_date: new Date().toISOString(),
          games_played: 0,
          wins: 0,
          losses: 0
        });
      }

      // Create achievement notification
      await base44.entities.Notification.create({
        user_email: user.email,
        type: 'achievement',
        title: '🏆 Arcade Master Unlocked!',
        message: 'You can now challenge the legendary Arcade Master!'
      });

      // Social feed entry
      await base44.entities.SocialFeed.create({
        user_email: user.email,
        activity_type: 'achievement',
        title: 'Unlocked Arcade Master',
        description: 'Achieved mastery and unlocked the ultimate challenge',
        is_featured: true
      });

      return Response.json({
        success: true,
        unlocked: true,
        just_unlocked: true
      });
    }

    return Response.json({
      success: true,
      unlocked: false,
      progress: {
        total_games: totalGames,
        required_games: UNLOCK_REQUIREMENTS.min_games,
        total_score: totalScore,
        required_score: UNLOCK_REQUIREMENTS.min_total_score,
        different_games: differentGames,
        required_different_games: UNLOCK_REQUIREMENTS.min_different_games
      }
    });

  } catch (error) {
    console.error('[Unlock] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
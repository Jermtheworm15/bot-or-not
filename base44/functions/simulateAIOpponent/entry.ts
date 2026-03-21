import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    const { game_id, difficulty = 'medium', is_arcade_master = false } = await req.json();

    if (!game_id) {
      return Response.json({ error: 'game_id required' }, { status: 400 });
    }

    // Get game config
    const games = await base44.asServiceRole.entities.ArcadeGame.filter({ game_id });
    if (games.length === 0) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = games[0];

    // Get historical player scores to calibrate AI
    const allScores = await base44.asServiceRole.entities.ArcadeScore.filter({ game_id }, '-score', 100);
    
    const avgScore = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length
      : 500;

    const topScore = allScores.length > 0 ? allScores[0].score : 1000;

    // Generate AI score based on difficulty and player data
    let aiScore = 0;

    if (is_arcade_master) {
      // Arcade Master: 90-110% of top score
      aiScore = Math.round(topScore * (0.9 + Math.random() * 0.2));
    } else {
      // Regular AI: scaled to difficulty
      const difficultyMultipliers = {
        easy: 0.5,
        medium: 0.75,
        hard: 0.95
      };

      const multiplier = difficultyMultipliers[difficulty] || 0.75;
      const variance = 0.2; // ±20% variance

      aiScore = Math.round(
        avgScore * multiplier * (1 + (Math.random() - 0.5) * variance)
      );
    }

    // Ensure minimum score
    aiScore = Math.max(100, aiScore);

    return Response.json({
      success: true,
      ai_score: aiScore,
      difficulty,
      is_arcade_master,
      metadata: {
        avg_player_score: Math.round(avgScore),
        top_player_score: topScore,
        total_games_analyzed: allScores.length
      }
    });

  } catch (error) {
    console.error('[AI] Simulation error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
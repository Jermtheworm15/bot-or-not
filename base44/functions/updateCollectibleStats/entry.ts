import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_id } = await req.json();

    // Get collectible
    const collectibles = await base44.asServiceRole.entities.ImageCollectible.filter({ image_id });
    if (collectibles.length === 0) {
      return Response.json({ error: 'Collectible not found' }, { status: 404 });
    }

    const collectible = collectibles[0];

    // Get latest votes
    const votes = await base44.asServiceRole.entities.ImageDifficultyVote.filter({ image_id });
    
    let average_difficulty = 5.0;
    let vote_count = votes.length;

    if (vote_count > 0) {
      average_difficulty = votes.reduce((sum, v) => sum + (v.difficulty_rating || 0), 0) / vote_count;
      average_difficulty = Math.round(average_difficulty * 10) / 10;
    }

    const confidence_multiplier = Math.min(vote_count / 10, 1.5);
    const value_score = Math.round(average_difficulty * confidence_multiplier * 100) / 100;

    let rarity_tier = 'common';
    if (value_score >= 12) rarity_tier = 'legendary';
    else if (value_score >= 9) rarity_tier = 'epic';
    else if (value_score >= 6) rarity_tier = 'rare';
    else if (value_score >= 4) rarity_tier = 'uncommon';

    // Update collectible
    const updated = await base44.asServiceRole.entities.ImageCollectible.update(collectible.id, {
      average_difficulty,
      vote_count,
      value_score,
      rarity_tier
    });

    return Response.json({ success: true, collectible: updated });
  } catch (error) {
    console.error('updateCollectibleStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
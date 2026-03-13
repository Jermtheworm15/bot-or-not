import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_id } = await req.json();

    // Check if collectible already exists
    const existing = await base44.asServiceRole.entities.ImageCollectible.filter({ image_id });
    if (existing.length > 0) {
      return Response.json({ error: 'Collectible already exists' }, { status: 400 });
    }

    // Get difficulty votes for this image
    const votes = await base44.asServiceRole.entities.ImageDifficultyVote.filter({ image_id });
    
    let average_difficulty = 5.0;
    let vote_count = votes.length;

    if (vote_count > 0) {
      average_difficulty = votes.reduce((sum, v) => sum + (v.difficulty_rating || 0), 0) / vote_count;
      average_difficulty = Math.round(average_difficulty * 10) / 10;
    }

    // Calculate value score (difficulty weighted by vote confidence)
    // More votes = more confidence in the score
    const confidence_multiplier = Math.min(vote_count / 10, 1.5); // caps at 1.5x for 10+ votes
    const value_score = Math.round(average_difficulty * confidence_multiplier * 100) / 100;

    // Determine rarity tier
    let rarity_tier = 'common';
    if (value_score >= 12) rarity_tier = 'legendary';
    else if (value_score >= 9) rarity_tier = 'epic';
    else if (value_score >= 6) rarity_tier = 'rare';
    else if (value_score >= 4) rarity_tier = 'uncommon';

    // Create collectible
    const collectible = await base44.asServiceRole.entities.ImageCollectible.create({
      image_id,
      owner_email: user.email,
      original_uploader_email: user.email,
      average_difficulty,
      vote_count,
      value_score,
      rarity_tier,
      acquisition_date: new Date().toISOString(),
      total_trades: 0,
      is_listed: false
    });

    // Ensure user has a wallet
    const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: user.email });
    if (wallets.length === 0) {
      await base44.asServiceRole.entities.TokenWallet.create({
        user_email: user.email,
        balance: 1000,
        lifetime_earned: 1000,
        lifetime_spent: 0
      });
    }

    return Response.json({ success: true, collectible });
  } catch (error) {
    console.error('createCollectible error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
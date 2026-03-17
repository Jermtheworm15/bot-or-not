import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const EARLY_ADOPTER = {
  achievement_id: 'early_adopter',
  name: 'Early Adopter',
  description: 'Joined Bot or Not during its founding days',
  category: 'progression',
  tier: 'gold',
  icon: '🚀',
  token_reward: 250,
  sort_order: 99,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Ensure achievement exists
    const existing = await base44.asServiceRole.entities.Achievement.filter({ achievement_id: 'early_adopter' });
    if (existing.length === 0) {
      await base44.asServiceRole.entities.Achievement.create(EARLY_ADOPTER);
    }

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    const results = [];

    for (const u of users) {
      try {
        // Check if already awarded
        const existing = await base44.asServiceRole.entities.UserAchievement.filter({
          user_email: u.email,
          achievement_id: 'early_adopter',
        });
        if (existing.length > 0) {
          results.push({ email: u.email, status: 'already_awarded' });
          continue;
        }

        // Award achievement
        await base44.asServiceRole.entities.UserAchievement.create({
          user_email: u.email,
          achievement_id: 'early_adopter',
          unlocked_at: new Date().toISOString(),
          progress: 1,
        });

        // Grant 250 tokens
        const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: u.email });
        const balance = wallets[0]?.balance || 0;
        if (wallets[0]) {
          await base44.asServiceRole.entities.TokenWallet.update(wallets[0].id, {
            balance: balance + 250,
          });
        } else {
          await base44.asServiceRole.entities.TokenWallet.create({
            user_email: u.email,
            balance: 250,
          });
        }

        // Record transaction
        await base44.asServiceRole.entities.TokenTransaction.create({
          user_email: u.email,
          transaction_type: 'admin_adjustment',
          amount: 250,
          balance_before: balance,
          balance_after: balance + 250,
          metadata: { reason: 'Early Adopter achievement reward' },
        });

        results.push({ email: u.email, status: 'awarded' });
      } catch (err) {
        results.push({ email: u.email, status: 'error', error: err.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
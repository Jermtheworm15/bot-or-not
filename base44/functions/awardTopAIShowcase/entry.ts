import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Awards tokens + badges to users with top-voted AI Showcase images
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin manual call or automation (no user auth required for scheduled)
    const isScheduled = req.headers.get('x-automation-trigger') === 'scheduled';
    if (!isScheduled) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    // Fetch all showcase posts sorted by votes
    const posts = await base44.asServiceRole.entities.AIShowcase.list('-votes', 200);
    if (!posts.length) return Response.json({ success: true, awarded: 0 });

    const top3 = posts.slice(0, 3);
    const awarded = [];

    const AWARD_CONFIG = [
      { rank: 1, tokens: 500, badge: '🥇 AI Creator #1', label: '1st Place AI Creator' },
      { rank: 2, tokens: 250, badge: '🥈 AI Creator #2', label: '2nd Place AI Creator' },
      { rank: 3, tokens: 100, badge: '🥉 AI Creator #3', label: '3rd Place AI Creator' },
    ];

    for (let i = 0; i < top3.length; i++) {
      const post = top3[i];
      const config = AWARD_CONFIG[i];
      if (!post.user_email || (post.votes || 0) <= 0) continue;

      // Get user's wallet
      const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: post.user_email });
      const wallet = wallets[0];
      if (!wallet) continue;

      const newBalance = (wallet.balance || 0) + config.tokens;

      // Update wallet
      await base44.asServiceRole.entities.TokenWallet.update(wallet.id, { balance: newBalance });

      // Log transaction
      await base44.asServiceRole.entities.TokenTransaction.create({
        user_email: post.user_email,
        transaction_type: 'admin_adjustment',
        amount: config.tokens,
        balance_before: wallet.balance || 0,
        balance_after: newBalance,
        metadata: { reason: config.label, post_id: post.id, votes: post.votes }
      });

      // Update UserProfile badge
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: post.user_email });
      if (profiles[0]) {
        const badges = profiles[0].badges || [];
        if (!badges.includes(config.badge)) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
            badges: [...badges, config.badge]
          });
        }
      }

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: post.user_email,
        type: 'award',
        title: `🏆 ${config.label}!`,
        message: `Your AI creation "${post.caption?.slice(0, 40)}..." ranked #${config.rank} with ${post.votes} votes! You earned ${config.tokens} tokens.`,
        is_read: false,
      });

      awarded.push({ rank: config.rank, user: post.user_email, tokens: config.tokens, votes: post.votes });
    }

    console.log(`[AIShowcaseAwards] Awarded ${awarded.length} users`);
    return Response.json({ success: true, awarded });

  } catch (error) {
    console.error('[AIShowcaseAwards]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
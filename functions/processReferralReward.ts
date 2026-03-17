import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FIRST_VOTE_REWARD = 100; // tokens for both users

async function grantTokens(base44, userEmail, amount, reason) {
  const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: userEmail });
  const balance = wallets[0]?.balance || 0;
  if (wallets[0]) {
    await base44.asServiceRole.entities.TokenWallet.update(wallets[0].id, { balance: balance + amount });
  } else {
    await base44.asServiceRole.entities.TokenWallet.create({ user_email: userEmail, balance: amount });
  }
  await base44.asServiceRole.entities.TokenTransaction.create({
    user_email: userEmail,
    transaction_type: 'reward_invite_activation',
    amount,
    balance_before: balance,
    balance_after: balance + amount,
    metadata: { reason },
  });
  console.log(`[Referral] Granted ${amount} tokens to ${userEmail}: ${reason}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referral_code, action_type } = body;

    console.log('[Referral] Processing:', action_type, 'for user:', user.email, 'code:', referral_code);

    // === FIRST VOTE: auto-detect and reward ===
    if (action_type === 'first_vote') {
      // Find any pending referrals where this user was referred
      const pendingReferrals = await base44.asServiceRole.entities.Referral.filter({
        referred_email: user.email,
      });

      const unrewarded = pendingReferrals.filter(r => !r.rewarded_signup);

      if (unrewarded.length === 0) {
        return Response.json({ success: true, message: 'No pending referrals', rewarded: false });
      }

      const results = [];
      for (const referral of unrewarded) {
        // Prevent self-referral
        if (referral.referrer_email === user.email) continue;

        // Mark referral as completed
        await base44.asServiceRole.entities.Referral.update(referral.id, {
          status: 'completed',
          rewarded_signup: true,
          rewarded_activation: true,
          activation_actions: 1,
        });

        // Award 100 tokens to BOTH users
        await grantTokens(base44, user.email, FIRST_VOTE_REWARD, `Referral reward - you were referred by ${referral.referrer_email}`);
        await grantTokens(base44, referral.referrer_email, FIRST_VOTE_REWARD, `Referral reward - ${user.email} cast their first vote`);

        // Update referrer profile
        const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: referral.referrer_email });
        if (referrerProfiles[0]) {
          const rp = referrerProfiles[0];
          const newCount = (rp.referral_count || 0) + 1;
          const newBadges = [...(rp.badges || [])];
          if (newCount === 1 && !newBadges.includes('referrer')) newBadges.push('referrer');
          if (newCount === 3 && !newBadges.includes('super_referrer')) newBadges.push('super_referrer');
          await base44.asServiceRole.entities.UserProfile.update(rp.id, {
            referral_count: newCount,
            is_premium: newCount >= 3,
            points: (rp.points || 0) + FIRST_VOTE_REWARD,
            badges: newBadges,
          });
        }

        // Notify referrer
        await base44.asServiceRole.entities.Notification.create({
          user_email: referral.referrer_email,
          type: 'referral_completed',
          title: '🎉 Referral Completed!',
          message: `${user.email.split('@')[0]} just cast their first vote! You both earned 100 tokens 🪙`,
        }).catch(() => {});

        // Social feed
        await base44.asServiceRole.entities.Activity.create({
          user_email: referral.referrer_email,
          username: referral.referrer_email.split('@')[0],
          action_type: 'badge_earned',
          description: `Earned 100 tokens from a successful referral!`,
          metadata: { referred_user: user.email, tokens: FIRST_VOTE_REWARD },
        }).catch(() => {});

        results.push({ referrer: referral.referrer_email, rewarded: true });
        console.log('[Referral] Both users rewarded:', user.email, '&', referral.referrer_email);
      }

      return Response.json({ success: true, rewarded: results.length > 0, results });
    }

    // === Legacy signup / activation flow ===
    if (!referral_code) {
      return Response.json({ success: false, error: 'referral_code required for this action_type' }, { status: 400 });
    }

    const referrals = await base44.asServiceRole.entities.Referral.filter({ referral_code });
    if (referrals.length === 0) {
      return Response.json({ success: false, error: 'Referral not found' }, { status: 404 });
    }

    const referral = referrals[0];
    if (referral.referrer_email === user.email) {
      return Response.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 });
    }

    if (action_type === 'signup' && !referral.rewarded_signup) {
      await base44.asServiceRole.entities.Referral.update(referral.id, {
        referred_email: user.email,
        status: 'signed_up',
        rewarded_signup: true,
      });
      return Response.json({ success: true, message: 'Signup recorded' });
    }

    return Response.json({ success: true, message: 'No action taken' });

  } catch (error) {
    console.error('[Referral] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
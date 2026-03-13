import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Reward configuration
const REWARDS = {
  correct_vote: 10,
  vote_streak_3: 30,
  vote_streak_5: 75,
  vote_streak_10: 200,
  vote_streak_25: 750,
  tournament_entry: 50,
  tournament_win: 1000,
  tournament_place_2: 500,
  tournament_place_3: 250,
  challenge_win: 300,
  challenge_participation: 50,
  upload_accepted: 100,
  referral_signup: 200,
  referral_activation: 500,
  daily_active: 25
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { reward_type, amount, metadata } = await req.json();

        if (!reward_type) {
            return Response.json({ success: false, error: 'reward_type required' }, { status: 400 });
        }

        console.log('[Reward] Processing reward:', reward_type, 'for user:', user.email);

        // Get or create token economy record
        let economy = await base44.asServiceRole.entities.TokenEconomy.list();
        if (economy.length === 0) {
            economy = [await base44.asServiceRole.entities.TokenEconomy.create({
                total_supply: 1000000000,
                tokens_distributed: 0,
                tokens_remaining: 1000000000,
                tokens_burned: 0,
                tokens_locked: 0
            })];
        }
        const economyRecord = economy[0];

        // Calculate reward amount
        let rewardAmount = amount || REWARDS[reward_type] || 0;

        if (rewardAmount <= 0) {
            return Response.json({ success: false, error: 'Invalid reward amount' }, { status: 400 });
        }

        // Check if enough tokens remain
        if (economyRecord.tokens_remaining < rewardAmount) {
            console.warn('[Reward] Insufficient tokens remaining');
            return Response.json({ 
                success: false, 
                error: 'Token supply depleted',
                tokens_remaining: economyRecord.tokens_remaining
            }, { status: 400 });
        }

        // Get or create user wallet
        let wallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: user.email });
        let wallet;
        
        if (wallets.length === 0) {
            wallet = await base44.asServiceRole.entities.TokenWallet.create({
                user_email: user.email,
                balance: 0,
                lifetime_earned: 0,
                lifetime_spent: 0
            });
        } else {
            wallet = wallets[0];
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + rewardAmount;

        // Update wallet
        await base44.asServiceRole.entities.TokenWallet.update(wallet.id, {
            balance: balanceAfter,
            lifetime_earned: wallet.lifetime_earned + rewardAmount
        });

        // Create transaction record
        await base44.asServiceRole.entities.TokenTransaction.create({
            user_email: user.email,
            transaction_type: `reward_${reward_type}`,
            amount: rewardAmount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            related_image_id: metadata?.image_id || null,
            related_tournament_id: metadata?.tournament_id || null,
            related_challenge_id: metadata?.challenge_id || null,
            related_referral_id: metadata?.referral_id || null,
            metadata: metadata || {}
        });

        // Update token economy
        await base44.asServiceRole.entities.TokenEconomy.update(economyRecord.id, {
            tokens_distributed: economyRecord.tokens_distributed + rewardAmount,
            tokens_remaining: economyRecord.tokens_remaining - rewardAmount
        });

        // Get or create reward stats
        let stats = await base44.asServiceRole.entities.UserRewardStats.filter({ user_email: user.email });
        if (stats.length === 0) {
            stats = [await base44.asServiceRole.entities.UserRewardStats.create({
                user_email: user.email,
                correct_votes: 0,
                current_vote_streak: 0,
                best_vote_streak: 0,
                lifetime_rewards_earned: 0
            })];
        }

        // Update reward stats
        await base44.asServiceRole.entities.UserRewardStats.update(stats[0].id, {
            lifetime_rewards_earned: stats[0].lifetime_rewards_earned + rewardAmount
        });

        console.log('[Reward] Granted:', rewardAmount, 'tokens. New balance:', balanceAfter);

        return Response.json({ 
            success: true,
            reward_amount: rewardAmount,
            balance: balanceAfter,
            tokens_remaining: economyRecord.tokens_remaining - rewardAmount
        });

    } catch (error) {
        console.error('[Reward] Grant error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});